declare namespace json = "http://basex.org/modules/json";

let $api-key := 'nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb'
    let $api-url := 'https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate'

let $body-data := '{
    "dataSource": "PhoneForYouCluster", 
    "database": "PhoneForYou",
    "collection": "customer",'
let $find-data := ' "filter": {
      
    }}
    '
let $json-data := '{
    "dataSource": "PhoneForYouCluster", 
    "database": "PhoneForYou",
    "collection": "Testing",
    "document": {
      "status": "open",
      "text": "Do the dishes"
    }
    
}'
    
    
let $insert-response:= http:send-request(<http:request method='post' >
                   <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                   <http:body media-type='application/json'/>
                   </http:request>,
                   "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/insertOne", $json-data)
 
 let $find-response:= http:send-request(<http:request method='post' >
                   <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                   <http:body media-type='application/json'/>
                   </http:request>,
                   "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/findOne", concat($body-data, $find-data))
   
                      
 let $delete-response:= http:send-request(<http:request method='post' >
                   <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                   <http:body media-type='application/json'/>
                   </http:request>,
                   "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/deleteOne", concat($body-data, $find-data))
                      
  let $api-key := 'nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb'
let $api-url := 'https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate'
let $getCustomer := '{
  "dataSource": "PhoneForYouCluster",
  "database": "PhoneForYou",
  "collection": "sales",
  "pipeline": [
    {
        "$match": {
            "date": {                
                "$gte": {"$date": "2023-01-01T00:00:00.000Z"},
                "$lt": {"$date": "2023-02-01T00:00:00.000Z"}
            }
        }
    },
    {
        "$lookup": {
            "from": "customer",
            "localField": "customer_id",
            "foreignField": "id",
            "as": "customer"
        }
    },
    {
        "$unwind": "$customer"
    },
    {
        "$group": {
            "_id": "$customer.id",
            "id": { "$first": "$customer.id" },
            "first_name": { "$first": "$customer.first_name" },
            "last_name": { "$first": "$customer.last_name" },
            "email": { "$first": { "$ifNull": ["$customer.email", "desconhecido"] } },
            "address": {
                "$first": {
                    "address": "$customer.address.address",
                    "city": "$customer.address.city",
                    "country": "$customer.address.country",
                    "postal_code": "$customer.address.postal_code"
                }
            },
            "customer_type": { "$first": "$customer.customer_type" },
            "last3years": { "$first": "$customer.last3years" }
        }
    },
    {
        "$project": {
            "_id": 0,
            
            "last3years.latest_purchase_date": 0
        }
    },
    {
        "$sort": {
            "id": 1
        }
    }]
}'

let $customer-response:= http:send-request(<http:request method='post' >
                   <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                   <http:body media-type='application/json'/>
                   </http:request>,
                   $api-url, $getCustomer)


let $getSales := '{
  "dataSource": "PhoneForYouCluster",
  "database": "PhoneForYou",
  "collection": "sales",
  "pipeline": [
    {
        "$match": {
            "date": {                
                "$gte": {"$date": "2023-01-01T00:00:00.000Z"},
                "$lt": {"$date": "2023-02-01T00:00:00.000Z"}
            }
        }
    },
    {
      "$project": {
        "_id": 0
      }
    },
    { 
       "$sort": {
          "date": 1
    }
  }
    ]
}'

let $sales-response:= http:send-request(<http:request method='post' >
                   <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                   <http:body media-type='application/json'/>
                   </http:request>,
                   $api-url, $getSales)


      let $getProducts := '{
      "dataSource": "PhoneForYouCluster",
      "database": "PhoneForYou",
      "collection": "sales",
      "pipeline": [
        {
            "$match": {
                "date": {                
                    "$gte": {"$date": "2023-01-01T00:00:00.000Z"},
                    "$lt": {"$date": "2023-02-01T00:00:00.000Z"}
                }
            }
        },
        {
            "$unwind": "$lines"
        },
        {
            "$lookup": {
                "from": "product",
                "localField": "lines.product_id",
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
        }]
    }'
    
    let $product-response:= http:send-request(<http:request method='post' >
                       <http:header name= "api-key" value='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb' />
                       <http:body media-type='application/json'/>
                       </http:request>,
                       "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate", $getProducts)


let $customerJson := $customer-response[2]//documents/_
let $customerXML :=
  element customers {
    for $customer in $customerJson
    return
      element customer {
        element id { data($customer/id) },
        element first_name { data($customer/first__name/text()) },
        element last_name { data($customer/last__name) },
        element email { data($customer/email)},
        element address {
          element address { data($customer/address/address) },
          element city { data($customer/address/city) },
          element country { data($customer/address/country) },
          element postal_code { data($customer/address/postal__code) }
        },
        element customer_type { data($customer/customer__type) },
        element last3years {
          element total_purchases { data($customer/last3years/total__purchases) },
          element total_spent { data($customer/last3years/total__spent) }
        }
      }
  }


 let $salesJson := $sales-response[2]//documents/_

let $salesXML :=
  element sales {
    for $sale in $salesJson
    return
      element sale {
        element invoice_id { data($sale/invoice__id) },
        element date { data($sale/date) },
        element customer_id { data($sale/customer__id) },
        element total { data($sale/total) },
        element lines {
          for $line in $sale/lines/_
          return
            element line {
              element id { data($line/id) },
              element product_id { data($line/product__id) },
              element quantity { data($line/quantity) },
              element total_with_vat { data($line/total__with__vat) }
            }
        }
      }
  }


let $productJson := $product-response[2]//documents/_

let $productXML :=
  element products {
    for $product in $productJson
    return
      element product {
        element id { data($product/id) },
        element brand { data($product/brand) },
        element model { data($product/model) },
        element price { data($product/price) },
        element categories {
          for $category in $product/categories/_
          return
            element { xs:QName(replace($category/category__name, ' ', '_')) } {
              data($category/sub__category__name)
            }
        }
      }
  }


  let $getCategories := '{
      "dataSource": "PhoneForYouCluster",
      "database": "PhoneForYou",
      "collection": "sales",
      "pipeline": [
          {
            "$match": {
                "date": {
                    "$gte": {"$date": "2023-01-01T00:00:00.000Z"},
                    "$lt": {"$date": "2023-02-01T00:00:00.000Z"}

                }
            }
        },
         {
        "$unwind": "$lines"
        },
        {
            "$lookup": {
                "from": "product",
                "localField": "lines.product_id",
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
                "_id": "$invoice_id",
                "categories": { "$addToSet": "$categories" }
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
    ]}'
    
    let $categories-response:= http:send-request(
        <http:request method='post'>
          <http:header name="api-key" value='{$api-key}'/>
          <http:body media-type='application/json'>{$getCategories}</http:body>
        </http:request>,
        $api-url
      )    
  
return $categories-response[2]








                   
          
                                     
  