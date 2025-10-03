// models/brand.model.js
const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const BrandSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, index: true },
    },
    { timestamps: true }
);

BrandSchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

module.exports = model("Brand", BrandSchema);
