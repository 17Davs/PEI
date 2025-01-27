module namespace page = 'http://basex.org/examples/web-page';
import module namespace file = 'http://expath.org/ns/file';

declare function page:create-date($month as xs:integer, $year as xs:integer) as xs:string {
    let $month-str := if ($month lt 10) then concat("0", $month) else string($month)
    let $date-str := "{$year}-{$month-str}-01T00:00:00.000Z"
    return xs:string(xs:dateTime($date-str))
};

declare
  %rest:path('/sales-report')
  %rest:GET
  %rest:query-param("mes", "{$month}")
  %rest:query-param("ano", "{$year}")
  function page:sales-report($month as xs:integer, $year as xs:integer) as document-node() {
 
    
    let $api-key := 'nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb'
    let $api-url := 'https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate'
    let $startDate := page:create-date($month, $year)
     let $endDate := $startDate + xs:yearMonthDuration("P1M")
    
(: ------------------- Para lista de customers -------------------:)
    let $getCustomer := '{
      "dataSource": "PhoneForYouCluster",
      "database": "PhoneForYou",
      "collection": "sales",
      "pipeline": [
        {
            "$match": {
                "date": {
                    "$gte": {"$date": $startDate},
                    "$lt": {"$date": $endDate}
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
                "_id": "$customer.id",jj
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
                       "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate", $getCustomer)      
     
(: ------------------- Para lista de vendas -------------------:)
     let $getSales := '{
      "dataSource": "PhoneForYouCluster",
      "database": "PhoneForYou",
      "collection": "sales",
      "pipeline": [
        {
            "$match": {
                "date": {                
                    "$gte": {"$date": "$startDate"},
                    "$lt": {"$date": "$endDate"}
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
                       "https://eu-west-2.aws.data.mongodb-api.com/app/data-wcvon/endpoint/data/v1/action/aggregate", $getSales)


      let $getProducts := '{
      "dataSource": "PhoneForYouCluster",
      "database": "PhoneForYou",
      "collection": "sales",
      "pipeline": [
        {
            "$match": {
                "date": {                
                    "$gte": {"$date": $startDate},
                    "$lt": {"$date": $endDate}
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

     
     
     

(:  --------------------- Transformação para XML -------------------------------:)
    (: Transformação customer :)
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
      
    (: Transformação sales :)
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

    (: Transformação products :)
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

     
    let $summaryXML :=
      element summary {
        element number_of_customers{},
        element number_of_products{},
        element total_in_sales{},
        element sales_per_category{
          
        }
      }

return $customerXML
  };

(:
declare
  %rest:path('/return-report')
  %rest:GET
  function page:return-report($partner as xs:string, $month as xs:integer) as document-node() {
    (: Your code to generate the return report goes here 
  };
:)