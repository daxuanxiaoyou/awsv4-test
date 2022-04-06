import * as CryptoJS from "crypto-js";
import * as dotenv from "dotenv";
import * as utf8 from "utf8";
import axios from 'axios';
import { algorithm, signedHeaders } from "./mod";


dotenv.config();

var accessKeyId = process.env.AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
var v4Identifier = 'aws4_request';
var region = 'us-east-1';

var service = 'metadata';

var host = '127.0.0.1:40001';
var endpoint = 'http://127.0.0.1:40001'

var method = 'GET';

const canonical_uri = '/metadata/main/7GniGvUzwx5wULwfwzHca3Kxke7rTVR4esPdJaDE92Jf';

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

export function getSignature(key, region, service, amzdate, host, canonical_uri) {
    const canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';
    const payload_hash = CryptoJS.SHA256(utf8.encode('')).toString(CryptoJS.enc.Base64);
    const canonical_request = method + '\n' + canonical_uri + '\n' + '' + '\n' + canonical_headers + '\n' + signedHeaders + '\n' + payload_hash;

    const time = amzdate.split('T');
    let datestamp = time[0];
    const credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';

    const hash1 = CryptoJS.SHA256(utf8.encode(canonical_request)).toString(CryptoJS.enc.Base64);

    const string_to_sign = algorithm + '\n' +  amzdate + '\n' +  credential_scope + '\n' +  hash1;

    const signing_key = getSignatureKey(key, datestamp, region, service);

    const signature = CryptoJS.HmacSHA256(signing_key, utf8.encode(string_to_sign)).toString(CryptoJS.enc.Base64);

    return signature;
}

function doGet(region, service, canonical_uri, host) {

    const date = new Date();
    const amzdate = date.toISOString();
    const time = amzdate.split('T');
    let datestamp = time[0];

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
    
    let signature = getSignature(secretAccessKey, region, service, amzdate, host, canonical_uri);
    const credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    const authorization_header = algorithm + ' ' + 'Credential=' + secretAccessKey + '/' + credential_scope + ', ' +  'SignedHeaders=' + signedHeaders + ', ' + 'Signature=' + signature;

    const headers = {'host':host, 'x-amz-date':amzdate, 'Authorization':authorization_header};

    const request_url = endpoint + canonical_uri;

    console.log('BEGIN REQUEST++++++++++++++++++++++++++++++++++++');
    console.log;('Request URL = ' + request_url);
    axios.get(request_url, 
        {
            headers: headers
        }
    ).then(r => {
        console.log('RESPONSE++++++++++++++++++++++++++++++++++++');
        console.log('Response code:', r.status);
        console.log(r.statusText);
    }).catch(e => {
        console.log('RESPONSE++++++ error');
        console.log('Response err', e);
    })

    axios.get(request_url
    ).then(r => {
        console.log('RESPONSE++++++++++++++++++++++++++++++++++++');
        console.log('Response code:', r.status);
        console.log(r.statusText);
    }).catch(e => {
        console.log('RESPONSE++++++ error');
        console.log('Response err', e);
    })
}

//doGet(region, service, canonical_uri, host);



