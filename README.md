# GCal Server API

Backend API For GCal Clone,
<br>
Authentication API

[![DeepScan grade](https://deepscan.io/api/teams/13554/projects/16524/branches/357480/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13554&pid=16524&bid=357480)

# Documentation

### Member API
https://documenter.getpostman.com/view/14329009/TzCL7ntF

### Auth API
https://documenter.getpostman.com/view/14329009/TzJx8wKc

## Configuration

Google cal api is configured using  2 config files including the following .env variables.

| Name | Description | Default | Required |
| ---- | ----------- | ------- | -------- |
| PORT | HTTP Port for the application | 322 | True |
| mongodb | URL for the mongoDB database connection | N/A | True |
| ADMIN_EMAIL | Administration email to send logging info etc to | N/A | False |
| SALT_ROUNDS | Salt rounds for hashing( larger > more secure but longer run times) | 13 |  True |

and also a config.js
```js
exports.conf = {
    monitoring: {
        // Should the monitoring server echo statistics every X second to the attached console.
        outputStats: false,            // Default: true
        outputStatsEvery: 10000,       // Default: 10000 ms eg 10 Seconds
    }
}
```
