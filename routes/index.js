var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/course-enrollment-total', [loginToEdx, getCourseEnrollment]);

var request = require('request');
var cheerio = require('cheerio');

var base = 'https://courses.edx.org';

cookieJar = request.jar();

function loginToEdx(req, res, next) {
    var opts = {
        method: 'GET',
        url: base + '/login',
        jar: cookieJar
    };
    request(opts, function(loginErr, logRes, loginBody) {
        if (loginErr || logRes.statusCode > 200) {
            res.json({
                "Error": loginErr || 'Unknown edX Error',
                "Code": logRes.statusCode
            });
            res.end(logRes.statusCode);
        }
        var csrf = cookieJar._jar.store.idx['courses.edx.org']['/'].csrftoken.value;
        var loginParams = {
            method: 'POST',
            url: base + '/login_ajax',
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
        })
    })
}

function getCourseEnrollment(req, res) {
    // fixme -- query default.
    var courses = req.query.course || 'BerkeleyX/BJC.1x/3T2015';
    // TODO: Learn promises. End Callback hell.
    if (courses.constructor == String) {
        courses = [ courses ];
    }

    var resultData = {

    };
    var TOTAL = courses.length;
    var responses = 0;
    courses.forEach(function courseDatsReq(course) {
        var enrollment = {
            method: 'GET',
            url: base + '/courses/' + course +  '/instructor#view-course_info',
            jar: cookieJar
        }
        request(enrollment, function(err, resp, body) {
            responses += 1;
            var $ = cheerio.load(body);
            // TODO: Make this more robust.
            var data = $('tr>td', '.enrollment-wrapper');
            var count = parseInt($(data['9']).text());
            resultData[course] = count;
            if (responses == TOTAL) {
                res.header('Content-type', 'application/json');
                res.send(JSON.stringify(resultData));
                res.status(200).end();
            }
        });
    });
}

// TODO: URL builder function...




module.exports = router;
