# edx-api-server
A web server that exposes edX functionality as an API

The goal of this is to aid in building and managing a high volume of edX courses. Recently, edX has started exposing a few APIs but many are not exposed in the publicly accessible edx.org or, just aren't available yet. As such, a lot of this work may be somewhat unstable as I am relying on screen scraping and reverse engineering techniques. It's quite possible that edX could update something that will break all or part of this work.... :sad:

**WARNING**: All of this is a gigantic work in progress and may change as needed... I also haven't implemented many of these ideas yet, because yeah, #GradStudentProblems

But, please, do test this out or send feedback!

---

## What this is
Currently, there is a simple nodeJS web server (using Express) which exposes an API that talks to edX. The app is designed to be deployed on Heroku or any similar service with minimal configuration. 

## Design Goals

* Focus efforts on production edX servers (edx.org, edge.edx.org, insights, etc)
	* However, this should work with any open edX instance with minimal changes.
* Provide a consistent interface to all the various edX products as need
* Build APIs on demand.
	* We're not going write everything all in one go...
	* That said, we're likely to focus on the tedious takes and the ones that are easiest to screw up. (Like complex enrollment stuff).
* Easily allow public endpoints for marketing or other automation uses.
	* See the enrollment counter below as an example.
* Provide a simple default request interface, that is easy to override.

## Current Endpoints

* `/course-enrollent-total`
	* This returns the total enrollment count in a course in a JSON format:
	`{"course-id": count}`

See below for general instructions on the current interface.

## Auth and Accounts
Almost every (useful) request to the edX server will require some kind of user authentication. However, depending on your use cases, you may not be able to securely send credentials with every request. To get around this, you can set environment variables. See `.env` for an example of how they work.

You need to explicitly set `REQUIRE_AUTH_ALWAYS=false` to allow public endpoints. Using `config.json`, you will then be able to specify which endpoints as publicly accessibile.

The general format for environment variables is to replace the `.` with `_` in the URLs you are using. The server will then search through the variables until it finds a match for the requested domain. (It starts from most specific subdomain to least specific to allow for setups like "edx.org" and "edge.edx.org" with different logins.)

_Note that only default edX logins are supported. Oauth, Google, CAS, etc login system integrations are currently not supported._ (But please, submit a pull request if you want to implement it!)

#### Headers
If you opt to send a username and password with each request, the current method is to use HTTP headers.
Use the following format:
`X-edx-username: test@test.com`
`X-edx-password: password12345`

Headers, if provided, will override any default system login info. If the headers fail to login properly, then there will be __no__ "fallback" to environment variables.

__PLEASE PLEASE PLEASE__ ensure that if you are passing credentials in headers that you are using a HTTPS connection! 

(Also the headers method isn't current implemented..)

## Interface
Every endpoint will have the same generic interface rules:

1. Pretty much every item requires a `courseID`. You can have a default course defined, but most requests will use a query parameter `course`.
	* `course` takes in a (url-encoded) edX course id such as "BerkeleyX/BJC.1x/3T2015"
	* It is also possible, to specify multiple courses at once for all endpoints:
	`?course[]=BerkeleyX/BJC.1x/3T2015&course[]=BerkeleyX/BJC.2x/3T2015`
	* NOTE: There is no special sauce for multiple requests -- if you specify too many courses you're liable to get timeout errors. (Though, really this shouldn't be a problem in most cases.)
2. All requests belong to an edX `domain` which you can specify with the parameter `domain` like: `?domain=my-custom-edx.com`
	* `edx` and `edge` are special cases to the production edX urls.
	* Subdomains like `studio.edge.edx.org` should be specified _without_ the subdomain, for example, just as `edge`.
		* Unless you have a weird setup where the authorization for a subdomain is different, in which case -- specify the full URL.
3. Authorization is handled via environment variables or HTTP headers. (See above.)

## Setting Defaults
Given that there's a lot of repetition involved in managing a course, it can be handy to set default values. These are controlled in `config.json`. For the most part the config should be straight-forward.

_As a reminder, default auth logic is handled via environment variables to help from inadvertently committing credentials to a public repo!_

__Note__: if you constantly change the default courses, you will change the behavior of any requests without a `course` parameter! Be weary of this if you are modifying course data. (However, if you're looking to make things like a "Current Status" board, then default courses should be very handy!)

__NOTE-2__: This isn't implemented yet. Hah. Sorry to burry the lede.