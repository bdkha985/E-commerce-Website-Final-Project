// models/caterogy.model.js

const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const CategorySchema = new Schema(
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
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        description: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

CategorySchema.pre("save", function (next) {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

module.exports = model("Category", CategorySchema);
