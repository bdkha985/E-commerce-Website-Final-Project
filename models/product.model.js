// models/product.model.js

const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const VariantSchema = new Schema(
    {
        sku: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            trim: true,
        },
        size: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        images: [
            {
                type: String,
            },
        ],
    },
    { _id: false }
);

const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
        brandId: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            required: true,
            index: true,
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "Category",
                required: true,
                index: true,
            },
        ],
        shortDesc: {
            type: String,
            required: true,
        },
        longDesc: {
            type: String,
            default: "",
        },
        images: [
            {
                type: String,
            },
        ],
        basePrice: {
            type: Number,
            default: 0,
        },
        variants: {
            type: [VariantSchema],
            default: [],
        },
        ratingAvg: {
            type: Number,
            default: 0,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        tags: [
            {
                type: String,
            },
        ],
    },
    { timestamps: true }
);

ProductSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

ProductSchema.index({ "variants.sku": 1 }, { unique: true, sparse: true });

module.exports = model("Product", ProductSchema);
