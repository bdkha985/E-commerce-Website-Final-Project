// services/search/elastic.service.js

// Polyfill cho lỗi "File is not defined" trên Node 18
if (!global.File) {
  global.File = class File extends Blob {
    constructor(fileBits, fileName, options) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options?.lastModified || Date.now();
    }
  };
}

const { Client } = require('@elastic/elasticsearch');
const Product = require('../../models/product.model');

const esClient = new Client({ node: 'http://elasticsearch:9200' });
const INDEX_NAME = 'products';

// Hàm chờ (sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kiểm tra kết nối và tạo Index (CÓ CƠ CHẾ THỬ LẠI)
 */
async function setupElasticsearch() {
    const maxRetries = 15; // Thử tối đa 15 lần
    const delay = 5000;    // Mỗi lần cách nhau 5 giây

    console.log('⏳ Đang kết nối ElasticSearch...');

    for (let i = 1; i <= maxRetries; i++) {
        try {
            // 1. Thử Ping
            await esClient.ping();
            console.log(`✅ Đã kết nối ElasticSearch (Lần thử ${i})`);

            // 2. Nếu kết nối OK, kiểm tra và tạo index
            const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
            
            if (!indexExists) {
                console.log(`Index [${INDEX_NAME}] không tồn tại. Đang tạo...`);
                await esClient.indices.create({
                    index: INDEX_NAME,
                    body: {
                        settings: {
                            analysis: {
                                analyzer: {
                                    default: { type: "standard" }
                                }
                            }
                        },
                        mappings: {
                            properties: {
                                name: { type: 'text' },
                                slug: { type: 'keyword' },
                                tags: { type: 'text' },
                                shortDesc: { type: 'text' },
                                brandName: { type: 'keyword' },
                                categoryNames: { type: 'keyword' },
                                thumb: { type: 'keyword', index: false },
                                price: { type: 'double' }
                            }
                        }
                    }
                });
                console.log(`✅ Đã tạo Index [${INDEX_NAME}]`);
            } else {
                console.log(`Index [${INDEX_NAME}] đã tồn tại.`);
            }

            return; // THÀNH CÔNG -> THOÁT HÀM

        } catch (err) {
            // Nếu lỗi, in cảnh báo và chờ
            console.warn(`⚠️ Lần thử ${i}/${maxRetries}: ElasticSearch chưa sẵn sàng. Đang chờ ${delay/1000}s...`);
            if (i < maxRetries) {
                await sleep(delay);
            } else {
                // Đã hết số lần thử mà vẫn lỗi
                console.error('❌ KHÔNG THỂ KẾT NỐI ELASTICSEARCH:', err.message);
                // Không exit process để tránh crash loop liên tục, 
                // chỉ log lỗi để app vẫn chạy (dù tính năng search sẽ hỏng)
            }
        }
    }
}

/**
 * Đồng bộ dữ liệu
 */
async function syncProductsToES() {
    console.log('Bắt đầu đồng bộ MongoDB -> ElasticSearch...');
    
    const products = await Product.find()
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .lean();

    if (products.length === 0) {
        console.log('Không có sản phẩm nào để đồng bộ.');
        return;
    }

    const getDisplayImage = (p) => (p.images?.length ? p.images[0] : (p.variants?.[0]?.images?.[0] || ''));
    const getDisplayPrice = (p) => (p.variants?.[0]?.price || p.basePrice || 0);
    
    const operations = products.flatMap(doc => {
        const esDoc = {
            name: doc.name,
            slug: doc.slug,
            tags: doc.tags || [],
            shortDesc: doc.shortDesc,
            brandName: doc.brandId?.name || null,
            categoryNames: (doc.categoryIds || []).map(c => c.name),
            thumb: getDisplayImage(doc).replace('public/', ''),
            price: getDisplayPrice(doc)
        };
        return [ { index: { _index: INDEX_NAME, _id: doc._id.toString() } }, esDoc ];
    });

    try {
        // Xóa và tạo lại để đảm bảo sạch
        const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
        if (indexExists) {
            await esClient.indices.delete({ index: INDEX_NAME });
        }
        
        // Setup lại mapping trước khi insert
        await setupElasticsearch(); 

        const bulkResponse = await esClient.bulk({ refresh: true, body: operations });
        if (bulkResponse.errors) {
            console.error('Lỗi khi bulk insert:', bulkResponse.items);
        } else {
            console.log(`✅ Đồng bộ thành công ${products.length} sản phẩm.`);
        }
    } catch (e) {
        console.error("Lỗi đồng bộ ES:", e.message);
    }
}

async function searchProducts(query) {
    if (!query) return [];
    try {
        const { hits } = await esClient.search({
            index: INDEX_NAME,
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ['name^3', 'tags^2', 'shortDesc'],
                        fuzziness: "AUTO"
                    }
                }
            }
        });
        return hits.hits.map(hit => ({ _id: hit._id, ...hit._source }));
    } catch (err) {
        console.error("Lỗi tìm kiếm ES:", err.message);
        return [];
    }
}

module.exports = {
    esClient,
    setupElasticsearch,
    syncProductsToES,
    searchProducts
};