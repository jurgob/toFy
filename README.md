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
    * Return: *{status:200|400|401|404|423, data:{}}*
    * Description: *Gets a list from the server. A password is required if the list has a password.*

* **Set Password:** HTTP PUT list/[listname]/password
    * Header parameters: *password (base64)*, *newpassword (base64)*
    * Return: *{status:200|400|401|404, data:{}}*
    * Description: *Set the password for a list, a blank password is equivalent to no password. A password is required if the list has already a password.*

* **Listen to changes on a list (Server-sent events):** HTTP GET list/[listname]/updates
    * Header parameters: *password (base64)*
    * Return: *{status:200|400|401|404, data:{items:["item","item"...]}}*
    * Description: *Gets a list from the server. A password is required if the list has a password.*
    * Events structure:
        * id: *unique time-based message id*
        * list: *name of the list*
        * event: *UNREG|REG|ITEM_ADD|ITEM_DEL|LIST_DEL|PW_CHANGE*
        * data: *Json object containing info about the event (e.g. {"item":"itemdeletedname"})*

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
* **400**: Bad request (wrong syntax).
* **401**: Unauthorised (wrong password).
* **404**: Not found (list or item does not exist).
* **409**: Conflict (adding existing item/list).
* **412**: Precondition failed (list does not exist when an item is addes).
* **423**: Locked (trying to delete a list locked by another user [not yet implemented]).
* **200**: Ok.

## Events
* **UNREG**: Another client stopped receiving events from the list.
* **REG**: Another client started receiving events from the list.
* **ITEM_ADD**: An item has been added to the list. The data field contains variable named "item" with the name of the item.
* **ITEM_DEL**: An item has been removed from the list. The data field contains variable named "item" with the name of the item.
* **LIST_DEL**: The list has been deleted.
* **PW_CHANGE**: The password has been changed on this list.


