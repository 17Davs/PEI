db.customer.aggregate([
    {
        $lookup: {
            from: "address",
            localField: "address_id",
            foreignField: "address_id",
            as: "address"
        }
    },
    {
        $unwind: "$address"
    },
    {
        $lookup: {
            from: "city",
            localField: "address.city_id",
            foreignField: "city_id",
            as: "address.city"
        }
    },
    {
        $unwind: "$address.city"
    },
    {
        $lookup: {
            from: "country",
            localField: "address.city.country_id",
            foreignField: "country_id",
            as: "address.country"
        }
    },
    {
        $unwind: "$address.country"
    },
    {
        $project: {
            "address.city": "$address.city.city", //para substituir o objecto city apenas pelo campo city 
            "address.country": "$address.country.country", //para substituir o objecto country apenas pelo campo counntry 
            "address.address": 1, //manter  o objecto address
            "address.postal_code": 1,
            "id": 1, //todos os campos de customer menos o do address_id
            "first_name": 1,
            "last_name": 1,
            "email": 1,
            "ative": 1,
            "create_date": 1,
            "gender": 1,
            "birthDate": 1
            // Adicione todos os outros campos que deseja incluir explicitamente
        }
    },
    {
        $out: "fullCustomer"
    }

])



//demora imenso
db.sales_header.aggregate([
    {
        $lookup: {
            from: "sales_lines",
            localField: "invoice_id",
            foreignField: "invoice_id",
            as: "lines"
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $group: {
            _id: "$invoice_id",
            date: { $first: "$date" },
            customer_id: { $first: "$customer_id" },
            lines: { $push: "$lines" } // Agrupa as linhas de venda em um array
        }
    },

])
db.sales_header.aggregate([
    {
        $lookup: {
            from: "sales_lines",
            localField: "invoice_id",
            foreignField: "invoice_id",
            as: "lines"
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $group: {
            _id: "$invoice_id",
            date: { $first: "$date" },
            customer_id: { $first: "$customer_id" },
            total_with_vat_sum: { $sum: "$lines.total_with_vat" }, // Soma dos total_with_vat
            lines: { $push: "$lines" } // Agrupa as linhas de venda em um array
        }
    },
    {
        $project: {
            _id: 0, // Remove o campo _id
            invoice_id: "$_id", // Renomeia _id para invoice_id
            date: 1,
            customer_id: 1,
            total_with_vat_sum: 1, // Adiciona o campo com a soma
            lines: {
                $map: {
                    input: "$lines",
                    as: "line",
                    in: {
                        id: "$$line.id",
                        total_with_vat: "$$line.total_with_vat",
                        quantity: "$$line.quantity",
                        product_id: "$$line.product_id"

                    }
                }
            }
        }
    },
    { $out: "sales" }
])



db.address.aggregate([
    {
        $lookup: {
            from: "city",
            localField: "city_id",
            foreignField: "city_id",
            as: "city"
        }
    },
    {
        $unwind: "$city"
    },

    {
        $lookup: {
            from: "country",
            localField: "city.country_id",
            foreignField: "country_id",
            as: "country"
        }
    },
    {
        $unwind: "$country"
    }
])

db.sales.updateMany({}, { $rename: { "total_with_vat_sum": "total" } })





//encontrando a venda com mais linhas associadas para analisar a melhor mopdulação
db.sales_header.aggregate([
    {
        $lookup: {
            from: "sales_lines",
            localField: "invoice_id",
            foreignField: "invoice_id",
            as: "lines"
        }
    },
    {
        $unwind: "$lines"
    },
    {
        $group: {
            _id: "$invoice_id",
            date: { $first: "$date" },
            customer_id: { $first: "$customer_id" },
            lines: { $push: "$lines" } // Agrupa as linhas de venda em um array
        }
    },
    {
        $project: {
            _id: 1,
            date: 1,
            customer_id: 1,
            num_lines: { $size: "$lines" } // Adiciona um campo com o número de linhas de venda
        }
    },
    {
        $sort: {
            num_lines: -1 // Ordena em ordem decrescente pelo número de linhas
        }
    },
    {
        $limit: 1 // Limita o resultado a apenas a venda com o máximo de linhas
    }
])
/* o output
{
  _id: 5638444, //este é o invoice_id 
  date: 2022-01-07T00:00:00.000Z,
  customer_id: 1,
  num_lines: 144
}
como da pra ver são 144 liinhas de venda logo não parece lçogico usar a forma embutida
e se fizer com mais exemplos: o 5º é {
  _id: 601904,
  date: 2022-01-11T00:00:00.000Z,
  customer_id: 4,
  num_lines: 62
}
{
  _id: 428198,
  date: 2022-01-26T00:00:00.000Z,
  customer_id: 16,
  num_lines: 72
} 
*/
//a venda encontrada
db.sales_header.findOne({ invoice_id: 5638444 })








db.products.aggregate([
    {
        $lookup: {
            from: "sub_category_product",
            localField: "id",
            foreignField: "product_id",
            as: "sub_category_products"
        }
    },
    {
        $unwind: "$sub_category_products"
    },
    {
        $lookup: {
            from: "sub_category",
            localField: "sub_category_products.sub_category_id",
            foreignField: "id",
            as: "sub_category"
        }
    },
    {
        $unwind: "$sub_category"
    },
    {
        $lookup: {
            from: "category",
            localField: "sub_category.category_id",
            foreignField: "id",
            as: "category"
        }
    },
    {
        $unwind: "$category"
    },
    {
        $group: {
            _id: "$id",
            list_price: { $first: "$list_price" },
            brand: { $first: "$brand" },
            model: { $first: "$model" },
            "5g": { $first: "$5g" },
            processor_brand: { $first: "$processor_brand" },
            battery_capacity: { $first: "$battery_capacity" },
            fast_charging: { $first: "$fast_charging" },
            ram_capacity: { $first: "$ram_capacity" },
            internal_memory: { $first: "$internal_memory" },
            screen_size: { $first: "$screen_size" },
            os: { $first: "$os" },
            primary_camera: { $first: "$primary_camera" },
            categories: {
                $first: {
                    gama_precos: "$category.name",
                    desempenho: "$sub_category.name",
                    // ... outras categorias
                }
            }
        }
    }
]);



//lista de  todos os clientes registados
db.fullCustomer.aggregate([
    {
        "$lookup": {
            "from": "sales",
            "localField": "id",
            "foreignField": "customer_id",
            "as": "customer_sales"
        }
    },
    {
        "$project": {
            "first_name": 1,
            "last_name": 1,
            "email": { "$ifNull": ["$email", "desconhecido"] },
            "address": "$address",
            "customer_type": {
                "$switch": {
                    "branches": [
                        {
                            "case": { "$lt": ["$create_date", { "$subtract": [ISODate(), 31536000000] }] },
                            "then": "novo"
                        },
                        {
                            "case": {
                                "$and": [
                                    { "$gte": ["$create_date", { "$subtract": [ISODate(), 157680000000] }] },
                                    { "$lt": ["$create_date", { "$subtract": [ISODate(), 31536000000] }] }
                                ]
                            },
                            "then": "regular"
                        },
                        {
                            "case": { "$gte": ["$create_date", { "$subtract": [ISODate(), 157680000000] }] },
                            "then": "premium"
                        }
                    ],
                    "default": "novo"
                }
            },
            "total_purchases": {
                "$size": {
                    "$filter": {
                        "input": "$customer_sales",
                        "cond": {
                            "$and": [
                                { "$gte": ["$$this.date", { "$subtract": [ISODate(), 94608000000] }] },
                                { "$lt": ["$$this.date", ISODate()] }
                            ]
                        }
                    }
                }
            },
            "total_purchase_value": {
                "$sum": "$customer_sales.total"
            }
        }
    }
])

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


