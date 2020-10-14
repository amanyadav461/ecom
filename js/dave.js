var BASE_URL = "https://dashboard.iamdave.ai"
var SIGNUP_API_KEY = "aG9tZSBjZW50cmUxNjAwODYyMDYxIDQ2"
var ENTEPRISE_ID = "home_centre"
function signup(data, success_func, error_func){
    var signupurl= BASE_URL + "/customer-signup";
    //Password string generator
    var randomstring = Math.random().toString(36).slice(-8);
    data = data || {}
    $.ajax({
        url: signupurl,
        method: "POST",
        dataType: "json",
        contentType: "json",
        withCredentials: true,
        headers:{
            "Content-Type":"application/json",
            "X-I2CE-ENTERPRISE-ID": ENTEPRISE_ID,
            "X-I2CE-SIGNUP-API-KEY": SIGNUP_API_KEY
        },
        data: JSON.stringify(data),
        success: function(data) {
            HEADERS = {
                "Content-Type":"application/json",
                "X-I2CE-ENTERPRISE-ID": ENTEPRISE_ID,
                "X-I2CE-USER-ID": data.customer_id,
                "X-I2CE-API-KEY": data.api_key
            }
            setCookie("authentication",JSON.stringify(HEADERS),24);
            setCookie("customer_id", data.customer_id);
            initialize_session();
            create_enquiry_list();
            if (success_func) {
                success_func(data);
            }
        },
        error: function(r, e) {
            console.log(e);
            if (error_func) {
                error_func(r, e);
            }
        }
    });
}

function get_products(params, callbackFunc) {
    ajaxRequestWithData("/objects/product", "GET", params, callbackFunc);
}

function patch_customer(params, callbackFunc) {
    let customer_id = getCookie('customer_id');
    ajaxRequestWithData("/object/customer/" + customer_id, "PATCH", JSON.stringify(params), callbackFunc);
}

function iupdate_customer(params, callbackFunc) {
    let customer_id = getCookie('customer_id');
    ajaxRequestWithData("/iupdate/customer/" + customer_id, "PATCH", JSON.stringify(params), callbackFunc);
}

function create_enquiry_list(params, callbackFunc) {
    let customer_id = getCookie('customer_id');
    params = params || {}
    params["customer_id"] = customer_id;
    ajaxRequestWithData("/object/enquiry_list", "POST", JSON.stringify(params), function(data) {
        setCookie("enquiry_list_id", data.enquiry_id);
        if (callbackFunc) {
            callbackFunc(data);
        }
    });
}

function sync_enquiry_list(params, callbackFunc) {
    let enquiry_list_id = getCookie('enquiry_list_id');
    ajaxRequestWithData("/object/enquiry_list/" + enquiry_list_id, "PATCH", JSON.stringify(params), callbackFunc);
}

function get_enquiry_list(callbackFunc) {
    params = {
        "enquiry_id": getCookie("enquiry_list_id"),
        "stage": "enquired"
    };
    ajaxRequestWithData("/objects/interaction", "GET", params, callbackFunc);
}

function create_product_enquiry(product_id, quantity, stage, callbackFunc) {
    if (quantity === undefined || quantity === null ) {
        quantity = 1;
    }
    params = {
        "product_id": product_id,
        "customer_id": getCookie('customer_id'),
        "quantity": quantity,
        "stage": stage || "enquired"
    }
    ajaxRequestWithData("/object/interaction", "POST", JSON.stringify(params), function(data) {
        sync_enquiry_list();
        if (callbackFunc) {
            callbackFunc(data);
        }
    });
}

function getCookie(key) {
    let result = window.localStorage.getItem(key);
    if ( !result ) {
        return null;
    }
    try{
        r = JSON.parse(result);
    }catch(err){
        if(result) {
            r = result;
        }
    }
    return r;
}

function setCookie(key, value, hoursExpire) {
    if ( hoursExpire === undefined ) {
        hoursExpire = 24
    }
    if ( value === null || value === undefined ) {
        return;
    }
    if ( typeof value == "object" ) {
        value = JSON.stringify(value);
    }
    if ( hoursExpire < 0 ) {
        window.localStorage.removeItem(key);
    } else {
        window.localStorage.setItem(key, value);
    }
}

function Trim(strValue) {
  return strValue.replace(/^\s+|\s+$/g, '');
}
 
function toTitleCase(str) {
    return str.replace(/_/g, ' ').replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

function generate_random_string(string_length){
    let random_string = '';
    let random_ascii;
    for(let i = 0; i < string_length; i++) {
        random_ascii = Math.floor((Math.random() * 25) + 97);
        random_string += String.fromCharCode(random_ascii)
    }
    return random_string
}


function ajaxRequestSync(URL, METHOD, callbackFunc, errorFunc, async, HEADERS){
       HEADERS = HEADERS || getCookie("authentication");
       $.ajax({
        url: BASE_URL + URL,
        method: (METHOD || "GET").toUpperCase(),
        dataType: "json",
        contentType: "json",
        async: async || false,
        headers: HEADERS,
        statusCode: {
            401: signup
        }
      }).done(function(data) {
          result=data;
          if (callbackFunc ) {
            callbackFunc(data);
          }
      }).fail(function(err) {
          if (errorFunc) {
              errorFunc(err)
          }
      });
}
function ajaxRequest(URL,METHOD,callbackFunc,errorFunc, HEADERS){
    return ajaxRequestSync(URL, METHOD, callbackFunc, errorFunc, true, HEADERS);
}

function ajaxRequestWithData(URL, METHOD, DATA, callbackFunc, errorFunc, unauthorized, HEADERS){
       HEADERS = HEADERS || getCookie("authentication");
       var defaultData="" ;
       if(DATA){
        defaultData=DATA;
       }
       if(!unauthorized) {
           unauthorized = signup
       }
       $.ajax({
        url: BASE_URL + URL,
        method: (METHOD || "GET").toUpperCase(),
        dataType: "json",
        contentType: "application/json",
        headers: HEADERS,
        data:defaultData,
        statusCode: {
            401: unauthorized,
            404: unauthorized,
        }
      }).done(function(data) {
          if (callbackFunc ) {
            callbackFunc(data);
          }
      }).fail(function(err) {
          if (errorFunc) {
              errorFunc(err)
          }
      });
}        

let timers = [];
function initialize_session() {
    patch_customer({
        'city': '{agent_info.ip}',
        'state': '{agent_info.ip}',
        'browser': '{agent_info.browser}',
        'os': '{agent_info.os}',
        'device_type': '{agent_info.device}'
    }, function(data) {
        setCookie("last_login", data.updated);
        iupdate_customer({"number_sessions": 1});
        let t = setTimeout(function(){
            iupdate_customer({'session_duration': 1});
            let t = setTimeout(function(){
                iupdate_customer({'session_duration': 5});
                let t = setTimeout(function(){
                    iupdate_customer({'session_duration': 10});
                    let t = setTimeout(function(){
                        iupdate_customer({'session_duration': 20});
                        let t = setTimeout(function(){
                            iupdate_customer({'session_duration': 30});
                            let t = setInterval(function() {
                                iupdate_customer({'session_duration': 60});
                            }, 60*1000);
                            timers.push(t);
                        }, 30000);
                        timers.push(t);
                    }, 20000);
                    timers.push(t);
                }, 10000);
                timers.push(t);
            }, 5000);
            timers.push(t);
        }, 1000);
        timers.push(t);
    });
}

$(document).ready(function () {
    if (!getCookie("authentication")) {
        signup();
    } else {
        initialize_session();
    }
});
