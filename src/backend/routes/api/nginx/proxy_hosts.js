'use strict';

const express           = require('express');
const validator         = require('../../../lib/validator');
const jwtdecode         = require('../../../lib/express/jwt-decode');
const internalProxyHost = require('../../../internal/proxy-host');
const apiValidator      = require('../../../lib/validator/api');

let router = express.Router({
    caseSensitive: true,
    strict:        true,
    mergeParams:   true
});

/**
 * /api/nginx/proxy-hosts
 */
router
    .route('/')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /api/nginx/proxy-hosts
     *
     * Retrieve all proxy-hosts
     */
    .get((req, res, next) => {
        validator({
            additionalProperties: false,
            properties:           {
                expand: {
                    $ref: 'definitions#/definitions/expand'
                },
                query:  {
                    $ref: 'definitions#/definitions/query'
                }
            }
        }, {
            expand: (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null),
            query:  (typeof req.query.query === 'string' ? req.query.query : null)
        })
            .then(data => {
                return internalProxyHost.getAll(res.locals.access, data.expand, data.query);
            })
            .then(rows => {
                res.status(200)
                    .send(rows);
            })
            .catch(next);
    })

    /**
     * POST /api/nginx/proxy-hosts
     *
     * Create a new proxy-host
     */
    .post((req, res, next) => {
        apiValidator({$ref: 'endpoints/proxy-hosts#/links/1/schema'}, req.body)
            .then(payload => {
                return internalProxyHost.create(res.locals.access, payload);
            })
            .then(result => {
                res.status(201)
                    .send(result);
            })
            .catch(next);
    });

/**
 * Specific proxy-host
 *
 * /api/nginx/proxy-hosts/123
 */
router
    .route('/:host_id')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * GET /api/nginx/proxy-hosts/123
     *
     * Retrieve a specific proxy-host
     */
    .get((req, res, next) => {
        validator({
            required:             ['host_id'],
            additionalProperties: false,
            properties:           {
                host_id: {
                    $ref: 'definitions#/definitions/id'
                },
                expand:  {
                    $ref: 'definitions#/definitions/expand'
                }
            }
        }, {
            host_id: req.params.host_id,
            expand:  (typeof req.query.expand === 'string' ? req.query.expand.split(',') : null)
        })
            .then(data => {
                return internalProxyHost.get(res.locals.access, {
                    id:     parseInt(data.host_id, 10),
                    expand: data.expand
                });
            })
            .then(row => {
                res.status(200)
                    .send(row);
            })
            .catch(next);
    })

    /**
     * PUT /api/nginx/proxy-hosts/123
     *
     * Update and existing proxy-host
     */
    .put((req, res, next) => {
        apiValidator({$ref: 'endpoints/proxy-hosts#/links/2/schema'}, req.body)
            .then(payload => {
                payload.id = parseInt(req.params.host_id, 10);
                return internalProxyHost.update(res.locals.access, payload);
            })
            .then(result => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    })

    /**
     * DELETE /api/nginx/proxy-hosts/123
     *
     * Update and existing proxy-host
     */
    .delete((req, res, next) => {
        internalProxyHost.delete(res.locals.access, {id: parseInt(req.params.host_id, 10)})
            .then(result => {
                res.status(200)
                    .send(result);
            })
            .catch(next);
    });

/**
 * Specific proxy-host Certificates
 *
 * /api/nginx/proxy-hosts/123/certificates
 */
router
    .route('/:host_id/certificates')
    .options((req, res) => {
        res.sendStatus(204);
    })
    .all(jwtdecode()) // preferred so it doesn't apply to nonexistent routes

    /**
     * POST /api/nginx/proxy-hosts/123/certificates
     *
     * Upload certifications
     */
    .post((req, res, next) => {
        if (!req.files) {
            res.status(400)
                .send({error: 'No files were uploaded'});
        } else {
            internalProxyHost.setCerts(res.locals.access, {
                id:    parseInt(req.params.host_id, 10),
                files: req.files
            })
                .then(result => {
                    res.status(200)
                        .send(result);
                })
                .catch(next);
        }
    });

module.exports = router;
