# ToFy

Todo/shopping list RESTful server developed in Node.js on Heroku.
The server offers a set of REST api for other clients to connect and edit the lists.

## Web service URL
[http://tofy.herokuapp.com/api/v1/](http://tofy.herokuapp.com/api/v1/)

**API**

-   Add list
    -   Method: POST lists/
    -   Headers:
    -   Content: {name:string, password:string, items:[]}
    -   Return:
-   Get list
    -   Method: GET lists/[list\_name]
    -   Headers: authorization (basic with empty username)
    -   Content:
    -   Return: {name:string, items:[{name:string,
        author:string, checked:bool,…}], observers:[author:string]}
-   Delete list
    -   Method: DELETE lists/[list\_name]
    -   Headers: authorization (basic with empty username)
    -   Content:
    -   Return:
-   Set password
    -   Method: PUT lists/[list\_name]/password
    -   Headers: authorization (basic with empty username)
    -   Content: {password:string}
    -   Return:
-   Get item
    -   Method: GET lists/[list\_name]/items/[item\_name]
    -   Headers: authorization (basic with empty username)
    -   Content: 
    -   Return: {name:string, last\_author:string, checked:bool,…}
-   Add item
    -   Method: POST lists/[list\_name]/items
    -   Headers: authorization (basic with empty username)
    -   Content: {name:string, checked:bool,…}
    -   Return: 
-   Delete item
    -   Method: DELETE lists/[list\_name]/items/[item\_name]
    -   Headers: authorization (basic with empty username)
    -   Content:
    -   Return: 
-   Change item:\
    -   Method: PATCH lists/[list\_name]/items/[item\_name]
    -   Headers: authorization (basic with empty username)
    -   Content: {index:int,name:string, checked,...}
    -   Return: 
-   Register for notifications:
    -   Method: GET lists/[list\_name]/sse
    -   Headers: authorization (basic with empty username)
    -   Content:
    -   Return: 

**Additional request headers**

-   User-Agent:string
-   Device-Id:string
-   Author:string

**Response headers**

-   WWW-Authenticate: Basic|None
-   Status:
    -   400: bad request (wrong syntax)
    -   401: unauthorised (wrong password)
    -   404: not found (list or item does not exist)
    -   409: conflict (put existing item/list)
    -   422: wrong json object given
    -   200: get ok
    -   201: put ok
    -   204: delete ok

**Server Sent Events**

event:{
    
type: UNREGISTER|REGISTER|ITEM\_ADD|ITEM\_DELTE|ITEM\_CHANGE|LIST\_DELETE|PW\_CHANGE,
    
list\_name:string,
    
item\_name:string,
    
author:string
    
}


