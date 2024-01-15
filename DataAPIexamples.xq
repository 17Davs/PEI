let $apiKey :='nlS5YxG0lkzw7IfmTys39aI7UKv8vB2ROA8kR1g0Qxr33KYkjDAbZSkCRpG7CqMb'

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
                      
                                  
                   
                   
 return $find-response[2]               
                                     
  