/*
* Copyright (c) 2017-2019 HERE Europe B.V.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* SPDX-License-Identifier: Apache-2.0
* License-Filename: LICENSE
*/

// https://developer.here.com/documentation/map-image/topics/introduction.html

'use strict';
const axios = require("axios");
const fs = require('fs');
const HERE_API = "https://image.maps.api.here.com/mia/1.6/mapview";
const HERE_APP_ID = process.env.HERE_APP_ID;
const HERE_APP_CODE = process.env.HERE_APP_CODE;
let statusCode,result;

const postProcessResource = async(resource, readFile) => {
    let ret = null;
    if (resource) {
        if (readFile) {
            ret = readFile(resource);
        }

        try {
            fs.unlinkSync(resource);
        } catch (err) {
            // Ignore
            console.log('unlinkSync err:'+err);
        }
    }
    return ret;
};

const download = async (url, filename) => {
    const writer = fs.createWriteStream(filename);

    await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    }).then((response) => {
        response.data.pipe(writer);

        console.log('response status:'+response.status);

        return new Promise((resolve, reject) => {
            writer.on('finish',() => {
                statusCode=response.status;
                resolve();
            });
            writer.on('error',(error) => {
                console.log('error in writing to file:'+error);
                statusCode="500";
                reject(new Error("error in writing to file"));
            });
        });
    },(error) =>{
        console.log('error in downloading map:'+error);
        statusCode = (error.response.status)? error.response.status : "500";
    });
};

exports.mapimageGET = async(event, context) => {
    console.log(`>>> process.env.HERE_APP_ID: ${process.env.HERE_APP_ID}`);
    console.log(`>>> process.env.HERE_APP_CODE: ${process.env.HERE_APP_CODE}`);
    console.log(`>>> event:\r\n${JSON.stringify(event)}`);

    let args = ""
    for (let qsp in event.params.querystring) {
        let qsa = "&" + qsp + "=" + event.params.querystring[qsp];
        console.log(`>>> QueryStringArg: ${qsa}`);
        args += qsa
    }

    const filename = "/tmp/mapview.png";
    const url = `${HERE_API}?app_id=${HERE_APP_ID}&app_code=${HERE_APP_CODE}${args}`;
    console.log(`>> url: ${url}`);

    await download(url, filename);

    if(statusCode == "200") {
        result = await postProcessResource(filename, (file) => new Buffer(fs.readFileSync(file)).toString('base64'));
        context.succeed(result);
    }
    else {
        context.fail('error in downloading map.');
    }
};