'use strict'

const cheerio = require('cheerio')
const http = require('http')
const querystring = require('querystring')

const getCookie = data => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'iframe.lfi-app.cl',
            port: 80,
            path: '/correos/tarificador/',
            method: 'GET'
        }
        const req = http.request(options, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`Nope, Request Failed. Status Code: ${res.statusCode}`))
            } else {
                res.setEncoding('utf8')
                let rawData = ''
                res.on('data', chunk => {
                    rawData += chunk
                })
                res.on('end', () => {
                    try {
                        const $ = cheerio.load(rawData, {
                            decodeEntities: false
                        })
                        const verificationtoken = $('input[name="__RequestVerificationToken"]').val()
                        if (!verificationtoken) throw new Error('No token available')
                        resolve({
                            verificationtoken,
                            cookie: res.headers['set-cookie'],
                        })
                    } catch (err) {
                        reject(err)
                    }
                })
            }
        })
        req.on('error', err => reject(err))
        req.end()
    })
}

const getData = (tokeninfo, values) => {
    return new Promise((resolve, reject) => {
        const qs = querystring.stringify({
            '__RequestVerificationToken': tokeninfo.verificationtoken,
            'tipo_cotizacion': 1,
            'comuna_remitente': 'ALHUE',
            'comuna_destino': 'CABRERO',
            'pais_destino': '',
            'codigo_servicio': 'P',
            'kilos': 3,
            'largo': 10,
            'alto': 10,
            'ancho': 10,
        })
        const options = {
            hostname: 'iframe.lfi-app.cl',
            port: 80,
            path: '/correos/tarificador/Tarificador/Calcular',
            method: 'POST',
            headers: {
                'Cookie' : tokeninfo.cookie,
                'Content-Type' : 'application/x-www-form-urlencoded',
            }
        }
        const req = http.request(options, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`Nope, Request Failed. Status Code: ${res.statusCode}`))
            } else {
                res.setEncoding('utf8')
                let rawData = ''
                res.on('data', chunk => {
                    rawData += chunk
                })
                res.on('end', () => {
                    try {
                        const prices = [];
                        const $ = cheerio.load(rawData, {
                            decodeEntities: false
                        })
                        const scrap = $('.wrap-tabla div span').each((key, price) => {
                            prices.push($(price.children).text())
                        })
                        if (!scrap) throw new Error('Not found')
                        resolve({
                            domicilio: prices[0] ? prices[0] : '',
                            sucursal: prices[1] ? prices[1] : '',
                        })
                    } catch (err) {
                        reject(err)
                    }
                })
            }
        })
        req.write(qs)
        req.on('error', err => reject(err))
        req.end()
    })
}

const getQuotation = data => {
    getCookie().then((response) => {
        console.log(response);
        getData(response).then((res) => {
            console.log('res', res);
        }).catch((err) => {
            console.log('rer', err);
        })
    }).catch((err) => {
        console.log(err);
    });
}

getQuotation();

module.exports = getQuotation