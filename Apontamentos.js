/*
Índice Crescente (1):
Se suas consultas frequentes envolvem busca por datas mais recentes, um índice crescente é geralmente mais eficiente.
Isso é útil para consultas que buscam as vendas mais recentes ou para análises em tempo real.
*/
db.sales_header.createIndex({ "date": 1 })

db.customer.createIndex({ "id": -1 })
db.product.createIndex({ "id": -1 })


db.sales_lines.createIndex({ "invoice_id": 1 })
db.sales_lines.createIndex({ "product_id": -1 })

//anotar os outros indices criados








