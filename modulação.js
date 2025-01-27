//Modificações feitas para modulação das Base de dados

// ---------------------------------------------------------------------------
//                         Relacionadas com as vendas
//
// - Embutir o lado N (sales_lines) no sales_header de forma a deixar mais fácil
//   futuras consultas tendo em conta o contexto do PhoneForYou
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
            _id: "$invoice_id", //agrupar pelo invoice_id
            date: { $first: "$date" },
            customer_id: { $first: "$customer_id" },
            total: { $sum: "$lines.total_with_vat" }, //soma do total das linhas de venda
            lines: { $push: "$lines" } //meter em array
        }
    },
    {
        $project: {
            _id: 0,
            "invoice_id": "$_id",
            "date": "$date",
            customer_id: "$customer_id",
            total: "$total",
            lines: {
                $map: {
                    input: "$lines",
                    as: "line",
                    in: {
                        id: "$$line.id",
                        product_id: "$$line.product_id",
                        quantity: "$$line.quantity",
                        total_with_vat: "$$line.total_with_vat"

                    }
                }
            }
        }
    },
    {
        $out: "sales" // a nova coleção 
    }
])
// ------------------------ Fim das Vendas -----------------------------------


// ---------------------------------------------------------------------------
//                         Relacionadas com customer
//
// - Embutir os dados de morada (address, city e country) visto que, segundo o 
//   contexto dado, não faz sentido existirem fora da coleção dos customers
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
        }
    },
    {
        $out: "fullCustomer" //coleção temporária criada
    }

])

// - Ajustar os documentos de fullCustomer para embutir dados sobre o tipo, 
//   quantidade de compras realizadas nos ultimos 3 anos e o seu valor total 
// --- Nesta primeira abordagem reparou-se que alguns customers ficavam fora do resultado:
db.sales.aggregate([
    {
        $match: {
            "date": { $gte: new Date(new Date() - 3 * 365 * 24 * 60 * 60 * 1000) } // Considerando os últimos 3 anos
        }

    },
    {
        $lookup: {
            from: "fullCustomer",
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
            first_name: { $first: "$customer.first_name" },
            last_name: { $first: "$customer.last_name" },
            email: { $first: "$customer.email" },
            active: { $first: "$customer.active" },
            create_date: { $first: "$customer.create_date" },
            gender: { $first: "$customer.gender" },
            birthDate: { $first: "$customer.birthDate" },
            address: { $first: "$customer.address" },
            total_purchases: { $sum: 1 },
            total_spent: { $sum: "$total" },
            latest_purchase_date: { $max: "$date" }
        }
    },
    {
        $project: {
            _id: 0,
            "id": "$_id",
            first_name: 1,
            last_name: 1,
            email: 1,
            active: 1,
            create_date: 1,
            gender: 1,
            birthDate: 1,
            address: 1,
            total_purchases: 1,
            total_spent: 1,
            latest_purchase_date: 1,
            customer_type: {
                $cond: {
                    //1 ano=365 dd ×24h × 60 min × 60 seg ×1000 milissegundos
                    if: { $lt: ["$create_date", { $subtract: [ISODate(), 31536000000] }] }, // menos de um ano
                    then: "novo",
                    else: {
                        $cond: {
                            if: { $lte: ["$create_date", { $subtract: [ISODate(), 63072000000] }] }, //entre 1 e 5 anos
                            then: "regular",
                            else: "premium"
                        }
                    }
                }
            }
        }
    },
    { $sort: { id: 1 } },
    { $out: "customer " }
])
// A razão para tal, dá-se pela falta de sales associadas a esses customers, logo usou-se a abordagem abaixo:

// agregação usada para ajustar os documentos do fullCustomer para criar a coleção final de customers
//realmente usada para o cluster
db.fullCustomer.aggregate([
    {
        $lookup: {
            from: "sales",
            localField: "id",
            foreignField: "customer_id",
            as: "sales"
        }
    },
    {
        $unwind: {
            path: "$sales",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $group: {
            _id: "$id",
            id: { $first: "$id" },
            first_name: { $first: "$first_name" },
            last_name: { $first: "$last_name" },
            email: { $first: { "$ifNull": ["$email", "desconhecido"] } },
            ative: { $first: "$ative" },
            create_date: { $first: "$create_date" },
            gender: { $first: "$gender" },
            birthDate: { $first: "$birthDate" },
            address: { $first: "$address" },
            total_purchases: { $sum: { $cond: [{ $gte: ["$sales.date", new Date(new Date() - 3 * 365 * 24 * 60 * 60 * 1000)] }, 1, 0] } },
            total_spent: { $sum: { $cond: [{ $gte: ["$sales.date", new Date(new Date() - 3 * 365 * 24 * 60 * 60 * 1000)] }, "$sales.total", 0] } },
            latest_purchase_date: { $max: "$sales.date" }
        }
    },
    {
        $project: {
            _id: 0,
            id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            address: 1,
            last3years: {
                total_purchases: "$total_purchases",
                total_spent: "$total_spent",
                latest_purchase_date: "$latest_purchase_date"
            },
            customer_type: {
                $cond: {
                    if: { $lt: [new Date(new Date() - 365 * 24 * 60 * 60 * 1000), { $toDate: "$create_date" }] },
                    then: "novo",
                    else: {
                        $cond: {
                            if: { $lte: [new Date(new Date() - 5 * 365 * 24 * 60 * 60 * 1000), { $toDate: "$create_date" }] },
                            then: "regular",
                            else: "premium"
                        }
                    }
                }
            },
            ative: 1,
            create_date: 1,
            gender: 1,
            birthDate: 1,

        }
    },
    {
        $sort: { id: 1 }
    },
    { $out: "customer" }
])
// ------------------------ Fim dos customers --------------------------------

// ---------------------------------------------------------------------------
//                         Relacionadas com product
// 
db.product.aggregate([
    {
        "$lookup": {
            "from": "sub_category_product",
            "localField": "id",
            "foreignField": "product_id",
            "as": "product_subcategories"
        }
    },
    {
        "$unwind": {
            "path": "$product_subcategories",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$lookup": {
            "from": "sub_category",
            "localField": "product_subcategories.sub_category_id",
            "foreignField": "id",
            "as": "subcategories"
        }
    },
    {
        "$unwind": {
            "path": "$subcategories",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$lookup": {
            "from": "category",
            "localField": "subcategories.category_id",
            "foreignField": "id",
            "as": "category"
        }
    },
    {
        "$unwind": {
            "path": "$category",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$group": {
            "_id": "$_id",
            "product_data": { "$first": "$$ROOT" },
            "categories": {
                "$push": {
                    "category_name": "$category.name",
                    "sub_category_name": "$subcategories.name"
                }
            }
        }
    },
    {
        "$replaceRoot": {
            "newRoot": {
                "$mergeObjects": ["$product_data", { "categories": "$categories" }]
            }
        }
    },
    {
        "$project": {
            "product_subcategories": 0,
            "subcategories": 0,
            "category": 0
        }
    }, { $sort: { id: 1 } }, { $out: "Product" }
])

db.product.updateMany(
    {},
    {
        $set: {
            list_price: { $divide: ['$list_price', 100] } // Divida por 100 para converter centavos para euros
        }
    }
)


// ------------------------ Fim dos products --------------------------------

// ---------------------------------------------------------------------------
//                         Relacionadas com Returns
// 

db.returns.aggregate([
    {
        $lookup: {
            from: "sales",
            localField: "invoice_id",
            foreignField: "invoice_id",
            as: "sales"
        }
    },
    {
        $unwind: {
            path: "$sales",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields: {
            days_until_return: {
                $cond: {
                    if: { $ifNull: ["$date", false] },
                    then: {
                        $divide: [
                            {
                                $subtract: [
                                    "$date",
                                    { $ifNull: ["$sales.date", "$date"] }
                                ]
                            },
                            86400000 // 1 day in milliseconds
                        ]
                    },
                    else: null
                }
            },
            early_return_flag: {
                $cond: {
                    if: {
                        $and: [
                            { $ifNull: ["$date", false] },
                            {
                                $lte: [
                                    {
                                        $divide: [
                                            {
                                                $subtract: [
                                                    "$date",
                                                    { $ifNull: ["$sales.date", "$date"] }
                                                ]
                                            },
                                            86400000 // 1 dia em milissegundos
                                        ]
                                    },
                                    3 // 3 dias é o vlor de referencia para saber se é true or false
                                ]
                            }
                        ]
                    },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            invoice_id: 1,
            product_id: 1,
            date: 1,
            invoice_date: "$sales.date",
            days_until_return: 1,
            early_return_flag_flag: 1
        }
    },
    { $out: "Returns" }
])

