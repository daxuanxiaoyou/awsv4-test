import * as CryptoJS from "crypto-js";
import * as dotenv from "dotenv";
import * as utf8 from "utf8";
import { algorithm, signedHeaders } from "./mod";

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
module.exports = function getSignature(key, region, service, amzdate, host, path) {
    const canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';
    const payload_hash = CryptoJS.SHA256(utf8.encode('')).toString(CryptoJS.enc.Base64);
    const canonical_request = method + '\n' + path + '\n' + '' + '\n' + canonical_headers + '\n' + signedHeaders + '\n' + payload_hash;

    const time = amzdate.split('T');
    let datestamp = time[0];
    const credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';

    const hash1 = CryptoJS.SHA256(utf8.encode(canonical_request)).toString(CryptoJS.enc.Base64);

    const string_to_sign = algorithm + '\n' +  amzdate + '\n' +  credential_scope + '\n' +  hash1;

    const signing_key = getSignatureKey(key, datestamp, region, service);

    const signature = CryptoJS.HmacSHA256(signing_key, utf8.encode(string_to_sign)).toString(CryptoJS.enc.Base64);

    return signature;
}

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
module.exports = function getHeader(key, region, service, amzdate, host, path) {
    //get datestamp 'Y-M-D'
    const time = amzdate.split('T');
    let datestamp = time[0];

    //get the signature
    let signature = getSignature(key, region, service, amzdate, host, path);
    
    const credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
    const authorization_header = algorithm + ' ' + 'Credential=' + key + '/' + credential_scope + ', ' +  'SignedHeaders=' + signedHeaders + ', ' + 'Signature=' + signature;

    //generate the headers
    const headers = {'host':host, 'x-amz-date':amzdate, 'Authorization':authorization_header};

    return  headers;
}

