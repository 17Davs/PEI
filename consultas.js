
// consulta para vendas em uma data
db.sales.find({
    "date": {
        $gte: ISODate("2023-12-01"),
        $lt: ISODate("2024-01-01")
    }
})

//das vendas para os clientes filtrando por datas
db.sales.aggregate([
    {
        "$match": {
            "date": {
                "$gte": ISODate("2023-01-01T00:00:00.000Z"),
                "$lt": ISODate("2023-02-01T00:00:00.000Z")
            }
        }
    },
    {
        "$lookup": {
            "from": "customer",
            "localField": "customer_id",
            "foreignField": "id",
            "as": "customer_info"
        }
    },
    {
        "$unwind": "$customer_info"
    },
    {
        "$group": {
            "_id": "$customer_id",
            "first_name": { "$first": "$customer_info.first_name" },
            "last_name": { "$first": "$customer_info.last_name" },
            "email": { "$first": { "$ifNull": ["$customer_info.email", "desconhecido"] } },
            "address": { "$first": "$customer_info.address" },
            "customer_type": { "$first": "$customer_info.customer_type" },
            "total_purchases": { "$sum": 1 },
            "total_purchase_value": { "$sum": "$total" }
        }
    }
]
)




//abordagem para juntar as sub categorias de um produto

db.sub_category_product.aggregate([
    {
        "$group": {
            "_id": "$product_id",
            "sub_categories": { "$push": "$sub_category_id" }
        }
    },
    {
        "$project": {
            "_id": 0,
            "product_id": "$_id",
            "sub_categories": 1
        }
    },
    {
        "$sort": {
            "product_id": 1,
            "sub_categories": 1
        }
    }
])