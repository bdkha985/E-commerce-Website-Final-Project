// services/search/elastic.service.js

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

// Kết nối tới service 'elasticsearch' trong docker-compose
const esClient = new Client({ node: 'http://elasticsearch:9200' });
const INDEX_NAME = 'products'; // Tên index của chúng ta

/**
 * Kiểm tra kết nối và tạo Index (nếu chưa có)
 */
async function setupElasticsearch() {
    try {
        await esClient.ping();
        console.log('✅ Đã kết nối ElasticSearch');

        // Kiểm tra xem index 'products' đã tồn tại chưa
        const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
        
        if (!indexExists) {
            console.log(`Index [${INDEX_NAME}] không tồn tại. Đang tạo...`);
            // Tạo index mới với cấu hình phân tích tiếng Việt (cơ bản)
            await esClient.indices.create({
                index: INDEX_NAME,
                body: {
                    settings: {
                        analysis: {
                            analyzer: {
                                default: {
                                    type: "standard",
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            name: { type: 'text' }, // Có thể tìm kiếm
                            slug: { type: 'keyword' }, // Chỉ tìm chính xác
                            tags: { type: 'text' },
                            shortDesc: { type: 'text' },
                            // Các trường khác chúng ta sẽ không tìm kiếm
                            brandName: { type: 'keyword' },
                            categoryNames: { type: 'keyword' },
                            thumb: { type: 'keyword', index: false }, // Không cần tìm ảnh
                            price: { type: 'double' }
                        }
                    }
                }
            });
            console.log(`✅ Đã tạo Index [${INDEX_NAME}]`);
        } else {
            console.log(`Index [${INDEX_NAME}] đã tồn tại.`);
        }
    } catch (err) {
        console.error('❌ Lỗi kết nối ElasticSearch:', err);
        // Thoát nếu không kết nối được ES
        process.exit(1); 
    }
}

/**
 * Lấy tất cả sản phẩm từ DB và đồng bộ sang ElasticSearch
 */
async function syncProductsToES() {
    console.log('Bắt đầu đồng bộ MongoDB -> ElasticSearch...');
    
    // 1. Lấy tất cả sản phẩm từ MongoDB
    const products = await Product.find()
        .populate('brandId', 'name')
        .populate('categoryIds', 'name')
        .lean();

    if (products.length === 0) {
        console.log('Không có sản phẩm nào để đồng bộ.');
        return;
    }

    // 2. Chuẩn bị "bulk" operations
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
        
        return [
            { index: { _index: INDEX_NAME, _id: doc._id.toString() } },
            esDoc
        ];
    });

    // 3. Xóa index cũ (để đảm bảo sạch)
    console.log(`Đang xóa index [${INDEX_NAME}] cũ...`);
    await esClient.indices.delete({ index: INDEX_NAME, ignore_unavailable: true });

    // === BỔ SUNG: TẠO LẠI INDEX ===
    // (Đảm bảo index tồn tại với mapping chính xác trước khi bulk)
    await esClient.indices.create({
        index: INDEX_NAME,
        body: {
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
    console.log(`Đã tạo lại index [${INDEX_NAME}].`);
    // === KẾT THÚC BỔ SUNG ===
    
    // 4. Thực hiện bulk insert
    const bulkResponse = await esClient.bulk({ refresh: true, body: operations });

    if (bulkResponse.errors) {
        console.error('Lỗi khi bulk insert:', bulkResponse.items);
    } else {
        console.log(`✅ Đồng bộ thành công ${products.length} sản phẩm.`);
    }
}

// Hàm tìm kiếm (sẽ được controller gọi)
async function searchProducts(query) {
    if (!query) return [];

    try {
        const { hits } = await esClient.search({
            index: INDEX_NAME,
            body: {
                query: {
                    multi_match: {
                        query: query,
                        fields: ['name^3', 'tags^2', 'shortDesc'], // Ưu tiên 'name' (gấp 3 lần)
                        fuzziness: "AUTO" // Cho phép gõ sai 1-2 ký tự
                    }
                }
            }
        });
        
        // Trả về kết quả đã được format
        return hits.hits.map(hit => ({
            _id: hit._id,
            ...hit._source // Dữ liệu sản phẩm (name, slug, thumb, price...)
        }));
        
    } catch (err) {
        console.error("Lỗi khi tìm kiếm ES:", err);
        return [];
    }
}

module.exports = {
    esClient,
    setupElasticsearch,
    syncProductsToES,
    searchProducts
};