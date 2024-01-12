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
                        total_with_vat: "$$line.total_with_vat",
                        quantity: "$$line.quantity",
                        product_id: "$$line.product_id"
                        // Adicione outros campos necessários
                    }
                }
            }
        }
    }
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


