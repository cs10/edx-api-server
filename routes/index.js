var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { 
        title: 'Express'
    });
});

router.get('/course-enrollment-total', [loginToEdx, getCourseEnrollment]);

var request = require('request');
var cheerio = require('cheerio');

var base = 'https://courses.edx.org';
var insightsBase = 'https://insights.edx.org';

cookieJar = request.jar();

function loginToEdx(req, res, next) {
    var opts = {
        method: 'GET',
        url: base + '/login',
        jar: cookieJar
    };
    request(opts, function(loginErr, logRes, loginBody) {
        var csrf, loginParams;
        
        if (loginErr || logRes.statusCode > 200) {
            res.json({
                "Error": loginErr || 'Unknown edX Error',
                "Code": logRes.statusCode
            });
            res.end(logRes.statusCode);
        }
        csrf = cookieJar._jar.store.idx['courses.edx.org']['/'].csrftoken.value;
        loginParams = {
            method: 'POST',
            url: base + '/user_api/v1/account/login_session/',
            jar: cookieJar,
            headers: {
                'X-CSRFToken': csrf,
                'Referer': base + '/login'
            },
            // TODO: Factor this out...
            formData: {
                email: process.env.EDX_ORG_USERNAME,
                password: process.env.EDX_ORG_PASSWORD
            }
        };
        request(loginParams, function(postErr, postRes, postBody) {
            next();
        });
    });
}

function getCourseEnrollment(req, res) {
    var courses = req.query.course || ['BerkeleyX/BJC.2x/3T2015'];
    // TODO: Learn promises. End Callback hell.
    if (courses.constructor == String) {
        courses = [ courses ];
    }

    var resultData = {},
        TOTAL = courses.length,
        responses = 0;

    courses.forEach(function courseDatsReq(course) {
        var enrollment = {
            method: 'GET',
            url: insightsBase + '/courses/' + course +  '/enrollment/activity',
            jar: cookieJar
        };
        
        request(enrollment, function(err, resp, body) {
            var $, data, number;
            responses += 1;
            
            $ = cheerio.load(body),
            // TODO: Make this more robust.
            data = $('.summary-point-number');
            // console.log(body);
            // data is 4 items of enrollment types.
            // The first is "total enrollment"
            resultData[course] = data[0].children[0].data;
            if (responses === TOTAL) {
                res.header('Content-type', 'application/json');
                res.send(JSON.stringify(resultData));
                res.status(200).end();
            }
        });
    });
}

// TODO: URL builder function...




module.exports = router;
