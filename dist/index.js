"use strict";
exports.__esModule = true;
exports.getSignature = void 0;
var CryptoJS = require("crypto-js");
var dotenv = require("dotenv");
var utf8 = require("utf8");
var axios_1 = require("axios");
var mod_1 = require("./mod");
dotenv.config();
var accessKeyId = process.env.AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var v4Identifier = 'aws4_request';
var region = 'us-east-1';
var service = 'metadata';
var host = '127.0.0.1:40001';
var endpoint = 'http://127.0.0.1:40001';
var method = 'GET';
var canonical_uri = '/metadata/main/7GniGvUzwx5wULwfwzHca3Kxke7rTVR4esPdJaDE92Jf';
/*

service = 'ec2'
host = 'ec2.amazonaws.com'
region = 'us-east-1'
endpoint = 'https://ec2.amazonaws.com'
request_parameters = 'Action=DescribeRegions&Version=2013-10-15'
*/
// get signature key from secret access key
function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = CryptoJS.HmacSHA256(dateStamp, "AWS4" + key);
    var kRegion = CryptoJS.HmacSHA256(regionName, kDate);
    var kService = CryptoJS.HmacSHA256(serviceName, kRegion);
    var kSigning = CryptoJS.HmacSHA256("aws4_request", kService);
    return kSigning;
}
function getSignature(key, region, service, amzdate, host, canonical_uri) {
    var canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';
    var payload_hash = CryptoJS.SHA256(utf8.encode('')).toString(CryptoJS.enc.Base64);
    var canonical_request = method + '\n' + canonical_uri + '\n' + '' + '\n' + canonical_headers + '\n' + mod_1.signedHeaders + '\n' + payload_hash;
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
function doGet(region, service, canonical_uri, host) {
    var date = new Date();
    var amzdate = date.toISOString();
    var time = amzdate.split('T');
    var datestamp = time[0];
    console.log("datestamp is ", datestamp);
    /*

    const date = new Date();
    const amzdate = date.toISOString();

    const datestamp = date.toDateString();

    console.log("amzdate is ", amzdate, " datestamp is ", datestamp);

    const canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';

    const payload_hash = CryptoJS.SHA256(utf8.encode('')).toString(CryptoJS.enc.Base64);

    const canonical_request = method + '\n' + canonical_uri + '\n' + '' + '\n' + canonical_headers + '\n' + signedHeaders + '\n' + payload_hash;


    const credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';

    const hash1 = CryptoJS.SHA256(utf8.encode(canonical_request)).toString(CryptoJS.enc.Base64);

    const string_to_sign = algorithm + '\n' +  amzdate + '\n' +  credential_scope + '\n' +  hash1;

    const signing_key = getSignatureKey(secretAccessKey, datestamp, region, service);

    const signature = CryptoJS.HmacSHA256(signing_key, utf8.encode(string_to_sign)).toString(CryptoJS.enc.Base64);
*/
    var signature = getSignature(secretAccessKey, region, service, amzdate, host, canonical_uri);
    var credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    var authorization_header = mod_1.algorithm + ' ' + 'Credential=' + secretAccessKey + '/' + credential_scope + ', ' + 'SignedHeaders=' + mod_1.signedHeaders + ', ' + 'Signature=' + signature;
    var headers = { 'host': host, 'x-amz-date': amzdate, 'Authorization': authorization_header };
    var request_url = endpoint + canonical_uri;
    console.log('BEGIN REQUEST++++++++++++++++++++++++++++++++++++');
    console.log;
    ('Request URL = ' + request_url);
    axios_1["default"].get(request_url, {
        headers: headers
    }).then(function (r) {
        console.log('RESPONSE++++++++++++++++++++++++++++++++++++');
        console.log('Response code:', r.status);
        console.log(r.statusText);
    })["catch"](function (e) {
        console.log('RESPONSE++++++ error');
        console.log('Response err', e);
    });
    axios_1["default"].get(request_url).then(function (r) {
        console.log('RESPONSE++++++++++++++++++++++++++++++++++++');
        console.log('Response code:', r.status);
        console.log(r.statusText);
    })["catch"](function (e) {
        console.log('RESPONSE++++++ error');
        console.log('Response err', e);
    });
}
doGet(region, service, canonical_uri, host);
