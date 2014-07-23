# ToFy

Todo/shopping list RESTful server developed in Node.js on Heroku.
The server offers a set of REST api for other clients to connect and edit the lists.

## Web service URL
[http://tofy.heroku.com/api/v1/](http://tofy.heroku.com/api/v1/)

## API
* **Add List:** HTTP PUT list/[listname]
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|409, data:{}}*
    * Description: *Adds a list to the server with an optional password.*

* **Get List:** HTTP GET list/[listname]
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|404, data:{items:["item","item"...]}}*
    * Description: *Gets a list from the server. A password is required if the list has a password.*
    
* **Remove List:** HTTP DELETE list/[listname]
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|404, data:{}}*
    * Description: *Gets a list from the server. A password is required if the list has a password.*

* **Set Password:** HTTP POST list/[listname]/password
    * Header parameters: *password (base64)*
    * Post parameters: *newpassword (base64)*
    * Return: *{status:200|400|401|404, data:{}}*
    * Description: *Set the password for a list, a blank password is equivalent to no password. A password is required if the list has already a password.*

* **Add an item to a list:** HTTP PUT list/[listname]/item/[itemname]
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|409|412, data:{items:["item","item"...]}}*
    * Description: *Adds an item to a list. A password is required if the list has a password.*

* **Remove an item from a list:** HTTP DELETE list/[listname]/item/[itemname]
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|404|412, data:{items:["item","item"...]}}*
    * Description: *Removes an item from a list. A password is required if the list has a password.*


## Status
The return codes mimic the HTTP protocol return codes:
* **400**: Bad request (wrong syntax)
* **401**: Unauthorised (wrong password)
* **404**: Not found (list or item does not exist)
* **409**: Conflict (adding existing item/list)
* **412**: Precondition failed (list does not exist when an item is addes)
* **200**: Ok


