
// ======================== Consultas para Sales Report ==================================================
// consulta para vendas em uma data
db.sales.find({
    "date": {
        /* $gte: ISODate("2023-12-01"),
         $lt: ISODate("2024-01-01")*/
        "$gte": ISODate("2023-01-01T00:00:00.000Z"),
        "$lt": ISODate("2023-02-01T00:00:00.000Z")
    }
}, { _id: 0 }).sort({ "date": 1 })


//lista de clientes envolvidos nas vendas
db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $lookup: {
            from: "customer",
            localField: "customer_id",
            foreignField: "id",
            as: "customer"
        }
    },
    {
        $unwind: "$customer"
    },
    {
        $group: {
            _id: "$customer.id",
            id: { $first: "$customer.id" },
            first_name: { $first: "$customer.first_name" },
            last_name: { $first: "$customer.last_name" },
            email: { $first: { $ifNull: ["$customer.email", "desconhecido"] } },
            address: {
                $first: {
                    address: "$customer.address.address",
                    city: "$customer.address.city",
                    country: "$customer.address.country",
                    postal_code: "$customer.address.postal_code"
                }
            },
            customer_type: { $first: "$customer.customer_type" },
            last3years: { $first: "$customer.last3years" }
        }
    },
    {
        $project: {
            _id: 0,
            "last3years.latest_purchase_date": 0
        }
    },
    {
        $sort: {
            id: 1
        }
    }])

// lista de produtos envolvidos nas vendas
db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $lookup: {
            from: "product",
            localField: "lines.product_id",
            foreignField: "id",
            as: "product"
        }
    },
    {
        $unwind: "$product"
    },

    {

        $group: {
            _id: "$product.id",
            brand: { $first: "$product.brand" },
            model: { $first: "$product.model" },
            list_price: { $first: "$product.list_price" },
            categories: { $first: "$product.categories" }

        }

    },
    {
        $project: {
            _id: 0,
            id: "$_id",
            brand: "$brand",
            model: "$model",
            price: "$list_price",
            categories: "$categories",

        }
    },
    {
        $sort: {
            id: 1
        }
    }])







//contar vendas por subcategoria
db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $lookup: {
            from: "product",
            localField: "lines.product_id",
            foreignField: "id",
            as: "product"
        }
    },
    {
        $unwind: "$product"
    },
    {
        $project: {
            "invoice_id": 1,
            categories: "$product.categories"
        }
    },
    {
        $unwind: "$categories"
    },
    {
        $group: {
            _id: "$invoice_id",
            categories: { $addToSet: "$categories" }
        }
    },
    {
        $unwind: "$categories"
    },
    {
        $group: {
            _id: {
                category_name: "$categories.category_name",
                sub_category_name: "$categories.sub_category_name"
            },
            count: { $sum: 1 }
        }
    },
    {
        $group: {
            _id: "$_id.category_name",
            subcategories: {
                $push: {
                    sub_category: "$_id.sub_category_name",
                    count: "$count"
                }
            }
        }
    },
    {
        $project: {
            _id: 0,
            category_name: "$_id",
            subcategories: 1
        }
    }
])
// ======================== Fim de consultas para Sales Report ==================================================

// 
//======================== Returns ==================================================
// lista de produtos envolvidos nas vendas
db.returns.aggregate([
    {
        "$match": {
            "date": {
                "$gte": { "$date": "2023-01-01T00:00:00.000Z" },
                "$lt": { "$date": "2023-02-01T00:00:00.000Z" }
            }
        }
    },
    {
        "$lookup": {
            "from": "product",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product"
        }
    },
    {
        "$unwind": "$product"
    },

    {

        "$group": {
            "_id": "$product.id",
            "brand": { "$first": "$product.brand" },
            "model": { "$first": "$product.model" },
            "list_price": { "$first": "$product.list_price" },
            "categories": { "$first": "$product.categories" }

        }

    },
    {
        "$project": {
            "_id": 0,
            "id": "$_id",
            "brand": "$brand",
            "model": "$model",
            "price": { "$divide": ["$list_price", 100] },
            "categories": "$categories"

        }
    },
    {
        "$sort": {
            "id": 1
        }
    }])

// lista de returns filtrado por mes
db.returns.find({
    "date": {
        "$gte": ISODate("2023-01-01T00:00:00.000Z"),
        "$lt": ISODate("2023-02-01T00:00:00.000Z")
    }
}, { _id: 0 }).sort({ "date": 1 })

//resumo de categorias devolvidas
db.returns.aggregate([
    {
        "$match": {
            "date": {
                "$gte": { "$date": "2023-01-01T00:00:00.000Z" },
                "$lt": { "$date": "2023-02-01T00:00:00.000Z" }
            }
        }
    },
    {
        "$lookup": {
            "from": "product",
            "localField": "product_id",
            "foreignField": "id",
            "as": "product"
        }
    },
    {
        "$unwind": "$product"
    },
    {
        "$project": {
            "invoice_id": 1,
            "categories": "$product.categories"
        }
    },
    {
        "$unwind": "$categories"
    },
    {
        "$group": {
            "_id": {
                "category_name": "$categories.category_name",
                "sub_category_name": "$categories.sub_category_name"
            },
            "count": { "$sum": 1 }
        }
    },
    {
        "$group": {
            "_id": "$_id.category_name",
            "subcategories": {
                "$push": {
                    "sub_category": "$_id.sub_category_name",
                    "count": "$count"
                }
            }
        }
    },
    {
        "$project": {
            "_id": 0,
            "category_name": "$_id",
            "subcategories": 1
        }
    }
])
// ======================== Fim Returns ===========================================


//-------------------------------------------------------------------------------------------------------------
//consultas adicionais para o resumo mas que não foram usadas, não usar no relatorio

//numero clientes diferentes
db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $project: {
            customer_id: 1
        }
    },
    {
        $group: {
            _id: "$customer_id",
        }
    },
    {
        $count: "number_of_customers"
    }
])

//numero produtos diferentes
db.sales.aggregate([
    {
        $match: {
            "date": {

                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $unwind: "$lines"
    },
    {

        $group: {
            _id: "$lines.product_id",

        }

    },
    {
        $count: "number_of_products"
    }
])

// total faturado em vendas
db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $project: {
            total: 1
        }
    },
    {
        $group: {
            _id: null,
            total_in_sales: { $sum: "$total" }
        }
    }
])


db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $group: {
            _id: "$lines.product_id",
            total: { $sum: "$lines.total_with_vat" }
        }
    },
    {
        $group: {
            _id: null,
            number_of_products: { $sum: 1 },
            total_in_sales: { $sum: "$total" }
        }
    }
])



db.sales.aggregate([
    {
        $match: {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        $project: {
            categories: 1
        }
    },
    {
        $group: {
            _id: "$categories.",

        }
    }
])