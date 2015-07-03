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
    // var course = req.query.course;
    var opts = {
        method: 'GET',
        url: base + '/login',
        jar: cookieJar
    };
    request(opts, function(loginErr, logRes, loginBody) {
        console.log('Login Page: ', logRes.statusCode);
        var csrf = cookieJar._jar.store.idx['courses.edx.org']['/'].csrftoken.value;
        var loginParams = {
            method: 'POST',
            url: base + '/login_ajax',
            jar: cookieJar,
            headers: {
                'X-CSRFToken': csrf,
                'Referer': base + '/login'
            },
            formData: {
                email: process.env.EDX_ORG_USERNAME,
                password: process.env.EDX_ORG_PASSWORD
            }
        };
        console.log('');
        console.log(loginParams);
        request(loginParams, function(postErr, postRes, postBody) {
            console.log('LOGGED IN!');
            console.log(postRes.statusCode);
            console.log(postRes);
            next();
        })
    })
}

function getCourseEnrollment(req, res) {
    enrollment = {
        method: 'GET',
        url: base + '/courses/BerkeleyX/BJC.1x/3T2015/instructor#view-course_info',
        jar: cookieJar
    }
    test = request(enrollment, function(err, resp, body) {
        console.log('SECOND RESPONE!');
        console.log(resp.statusCode);
        var $ = cheerio.load(body);
        var data = $('tr>td', '.enrollment-wrapper');
        res.json($(data['9']).text())
    })
}

module.exports = router;
