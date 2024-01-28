const l = require('@connibug/js-logging');

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const client = jwksClient({
    jwksUri: 'https://transgirl.uk.auth0.com/.well-known/jwks.json',
    requestHeaders: {}, // Optional
    timeout: 30000 // Defaults to 30s
});

let {rateLimit} = require("express-rate-limit");

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        "error": "Too many requests, please try again later.",
    }
});

function unauthorized(res, reason = "") {
    if(reason !== "") {
        l.warning(reason, "Unauthorized");
    }
    res.status(401).send({
        "error": "Unauthorized",
    });
    return false;
}

const token_auth = true;
async function auth(req, res, next) {
    let headers = req.headers;

    let ip = headers['x-forwarded-for'] || headers['x-real-ip'] || req.connection.remoteAddress;
    let decoded;
    if(token_auth && !ip.includes("192.168.1.238")) {
        // console.log(req.headers)
        let token = headers.authorization;
        if(!token) {
            return unauthorized(res, "no token");
        }
        token = token.split(' ')[1];

        try {
            const decodedToken = jwt.decode(token, {complete: true});
            console.log(decodedToken);

            if (decodedToken === null || decodedToken.header.alg !== 'RS256') {
                // we are only supporting RS256 so fail if this happens.
                console.log(token);
                return unauthorized(res, "invalid token 0x01");
            }

            const kid = decodedToken.header.kid;
            const key = await client.getSigningKey(kid);
            const signingKey = key.getPublicKey();
            decoded = await jwt.verify(token, signingKey);
        } catch (err) {
            console.log(err);
            console.log(token);
            return unauthorized(res, "invalid token 0x10");
        }
    } else {
        let user = JSON.parse(headers.user);
        decoded = {
            user_id: user.app_meta.uuid,
            role: user.app_meta.role,
        }
    }
    // console.log("decoded", decoded);
    if(!headers.user) {
        return unauthorized(res);
    }
    headers.user = JSON.parse(headers.user);
    if(!headers.user.app_meta.role || !headers.user.app_meta.uuid) {
        return unauthorized(res);
    }
    if(headers.user.app_meta.role === "Admin" && req.query !== {} && req.query.uid) {
        l.verbose("For user " + req.query.uid, "Admin Impersonation V2");
        headers.user['app_meta'].uuid = req.query.uid;
    }

    next();
}

module.exports = async function(req, res, next) {




    // let path = req.path;
    // let headers = req.headers;
    // console.log("HEADERS", headers);
    // l.verbose("Path: " + path);

    // limiter(req, res, function() {
    await auth(req, res, next);
    // });
}