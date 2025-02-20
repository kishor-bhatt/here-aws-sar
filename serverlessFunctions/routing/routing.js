/*
 * Copyright (c) 2017-2019 HERE Europe B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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

// https://developer.here.com/documentation/routing/topics/overview.html

'use strict';

const HERE_API = 'https://route.api.here.com/routing/7.2/calculateroute.json'

const axios = require("axios");
let statusCode = '200';

const getData = async url => {
    try {
        const response = await axios.get(url);
        statusCode = response.status;
        return response.data;
    } catch (error) {
        statusCode = error.response.status;
        // console.log('RESP:'+JSON.stringify(error.response.data));
        return error;
    }
};

exports.routingGET = async (event, context) => {
    console.log(`>>> process.env.HERE_APP_ID: ${process.env.HERE_APP_ID}`);
    console.log(`>>> process.env.HERE_APP_CODE: ${process.env.HERE_APP_CODE}`);

    let args = "";
    for (let qsp in event.queryStringParameters) {
        let qsa = "&" + qsp + "=" + event['queryStringParameters'][qsp]
        console.log(`>>> QueryStringArg: ${qsa}`);
        args += qsa
    }

    const url = `${HERE_API}?app_id=${process.env.HERE_APP_ID}&app_code=${process.env.HERE_APP_CODE}` + args;
    console.log(`>>> url: ${url}`);

    const hlsAPIResponse = await getData(url);

    const response = {
        statusCode: statusCode,
        // headers: { 'Access-Control-Allow-Origin': '*' },
        body: (statusCode == '200')? JSON.stringify(hlsAPIResponse) : JSON.stringify({"type":hlsAPIResponse.response.data.type,"subtype":hlsAPIResponse.response.data.subtype,
            "details":hlsAPIResponse.response.data.details})
    };

    context.succeed(response);
};