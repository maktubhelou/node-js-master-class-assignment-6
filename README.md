# Node.js Master Class - Assignment #6

## Hello World across multiple cores

- This is a minor update for the original RESTful JSON API homework assignment, refactored to run across multiple cores.
- The API accepts a localhost URL with a pathname. If the pathname "hello" is requested it will return a JSON formatted greeting.
- If an unknown path is requested it will return a 404 status code with a message.
