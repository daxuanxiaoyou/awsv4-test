"use strict";
exports.__esModule = true;
exports.getHeader = exports.getSignature = void 0;
var CryptoJS = require("crypto-js");
var dotenv = require("dotenv");
var utf8 = require("utf8");
var mod_1 = require("./mod");
dotenv.config();
var method = 'GET';
// get signature key from secret access key
function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = CryptoJS.HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);
    return kSigning;
}
/*
generate the signature from the given paras:
key - the AWS_SECRET_ACCESS_KEY
region - the region of your vm (i.e 'us-east-1')
service - the service requested (i.e: 'metadata', 'tokeninfo' ...)
amzdate - the date: get by date.toISOString, the amzdate comes from the request header when check the signature
host - the server of the service
path - the request path, must begin with '/' (i.e: /main/0x........)
*/
function getSignature(key, region, service, amzdate, host, path) {
    var canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';
    var payload_hash = CryptoJS.SHA256(utf8.encode('')).toString(CryptoJS.enc.Base64);
    var canonical_request = method + '\n' + path + '\n' + '' + '\n' + canonical_headers + '\n' + mod_1.signedHeaders + '\n' + payload_hash;
    var time = amzdate.split('T');
    var datestamp = time[0];
    var credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var hash1 = CryptoJS.SHA256(utf8.encode(canonical_request)).toString(CryptoJS.enc.Base64);
    var string_to_sign = mod_1.algorithm + '\n' + amzdate + '\n' + credential_scope + '\n' + hash1;
    var signing_key = getSignatureKey(key, datestamp, region, service);
    var signature = CryptoJS.HmacSHA256(signing_key, utf8.encode(string_to_sign)).toString(CryptoJS.enc.Base64);
    return signature;
}
exports.getSignature = getSignature;
/*
generate the header from the given paras:
key - the AWS_SECRET_ACCESS_KEY
region - the region of your vm (i.e 'us-east-1')
service - the service requested (i.e: 'metadata', 'tokeninfo' ...)
amzdate - the date: get by date.toISOString
host - the server of the service
path - the request path, must begin with '/' (i.e: /main/0x........)

[return values]:
the returned "headers" is the headers of the real request
(i.e :
    request_url = 'http://' + host + '/' + service + path
    axios.get(request_url,
        {
            headers: headers
        }
    )
)
*/
function getHeader(key, region, service, amzdate, host, path) {
    //get datestamp 'Y-M-D'
    var time = amzdate.split('T');
    var datestamp = time[0];
    //get the signature
    var signature = getSignature(key, region, service, amzdate, host, path);
    var credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var authorization_header = mod_1.algorithm + ' ' + 'Credential=' + key + '/' + credential_scope + ', ' + 'SignedHeaders=' + mod_1.signedHeaders + ', ' + 'Signature=' + signature;
    //generate the headers
    var headers = { 'host': host, 'x-amz-date': amzdate, 'Authorization': authorization_header };
    return headers;
}
exports.getHeader = getHeader;
