var BASE_URL = "https://dashboard.iamdave.ai"
var SIGNUP_API_KEY = "aG9tZSBjZW50cmUxNjAwODYyMDYxIDQ2"
var ENTEPRISE_ID = "home_centre"
function signup(data, callbackFunc, errorFunc){
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
            if (callbackFunc) {
                callbackFunc(data);
            }
        },
        error: function(r, e) {
            console.log(e);
            if (errorFunc) {
                errorFunc(r, e);
            }
        }
    });
}

// You can get the column names of any model with the following API
// ajaxRequestWithData("/attributes/<model_name>/name", "GET", 

function get_products(params, callbackFunc, errorFunc) {
    // You can filer the products using the following types of queries
    //
    // Filter by Pincode
    // get_products({"available_pincodes": <pincode of customer>"}, function(data) { console.log(data) })
    //
    // Filter by price range
    // get_products({"price": "100,500"}, function(data) { console.log(data) })
    //
    // Filter by maximum price 
    // get_products({"price": ",1000"}, function(data) { console.log(data) })
    //
    // Search by keyword
    // get_products({"keywords": "~search keyword"}, function(data) { console.log(data) })
    //
    // Search by multiple factors
    // get_products({"keywords": "~search keyword"}, function(data) { console.log(data) })
    //
    // Set page size (default page size is 50)
    // get_products({"keywords": "~search keyword", "_page_size": 20}, function(data) { console.log(data) })
    // 
    // Set page number
    // get_products({"keywords": "~search keyword", "_page_size": 20, "_page_number": 2}, function(data) { console.log(data) })
    //
    //
    params = params || {};
    let pincode = getCookie("pincode");
    if ( pincode && !params["available_pincodes"] ) {
        params["available_pincodes"] = pincode;
    }
    ajaxRequestWithData("/objects/product", "GET", params, callbackFunc, errorFunc);
    if ( params.keywords && !getCookie("searched") ) {
        patch_customer({"searched": true, "_async": true});
        setCookie("searched", true);
    }
    if ( params.price && !getCookie("filtered_price") ) {
        patch_customer({"filtered_price": true, "_async": true});
        setCookie("filtered_price", true);
    }
}

function get_product(product_id, callbackFunc, errorFunc) {
    // Assumption here is that the product id is set in the cookie using setCookie("product_id", <product_id>)
    product_id = product_id || getCookie("selected_product_id");
    ajaxRequestWithData("/object/product/" + product_id, "GET", params, callbackFunc, errorFunc);
}

function patch_customer(params, callbackFunc, errorFunc) {
    // e.g. patch_customer({"pincode": <pincode>, "name": <name of customer>, "company_name": <company_name>}, function(data) {console.log(data)});
    // In the response you will get the warehouse_id
    let customer_id = getCookie('customer_id');
    params = params || {};
    if ( params.name && params.email && params.company_name ) {
        params["signed_up"] = true;
    }
    ajaxRequestWithData("/object/customer/" + customer_id, "PATCH", JSON.stringify(params), function(data) {
        setCookie("pincode", data["pincode"])
        setCookie("warehouse_id", data["warehouse_id"])
        if ( params.enquiry_placed ) {
            sync_enquiry_list({"enquiry_placed": true, "_async": true})
            setCookie("enquiry_placed", true);
            create_enquiry_list({}, callbackFunc);
        } else if ( callbackFunc ) {
            callbackFunc(data)
        }
    }, errorFunc);
}

function iupdate_customer(params, callbackFunc, errorFunc) {
    // Used to update session duration and session number
    let customer_id = getCookie('customer_id');
    params = params || {};
    params['_async'] = true;
    ajaxRequestWithData("/iupdate/customer/" + customer_id, "PATCH", JSON.stringify(params), callbackFunc, errorFunc);
}
//For creating a new enquiry you need to first fire this function to connect customer id with enquiry id - aman
function create_enquiry_list(params, callbackFunc, errorFunc) {
    let customer_id = getCookie('customer_id');
    params = params || {};
    params["customer_id"] = customer_id;
    ajaxRequestWithData("/object/enquiry_list", "POST", JSON.stringify(params), function(data) {
        setCookie("enquiry_list_id", data.enquiry_id);
        if (callbackFunc) {
            callbackFunc(data);
        }
    }, errorFunc);
}
//This function is used to make any change in data made by create_enquiry_list - aman
function sync_enquiry_list(params, callbackFunc, errorFunc) {
    let enquiry_list_id = getCookie('enquiry_list_id');
    params = params || {};
    ajaxRequestWithData("/object/enquiry_list/" + enquiry_list_id, "PATCH", JSON.stringify(params), callbackFunc, errorFunc);
}
//Used to fetch complete enquiry list that is generated by customer - aman
function get_enquiry_list(callbackFunc, errorFunc) {
    params = {
        "enquiry_id": getCookie("enquiry_list_id"),
        "stage": "enquired"
    };
    ajaxRequestWithData("/objects/interaction", "GET", params, callbackFunc, errorFunc);
}
//Always Create Stage Using this function only - aman
function create_product_enquiry(product_id, quantity, stage, callbackFunc, errorFunc) {
    //
    //   stage can be
    //   "opened" (if product page is visited )
    //   "viewed" (if product is viewed)
    //   "enquired" (if enquiry is placed on the product, default)
    //
    if (quantity === undefined || quantity === null ) {
        quantity = 1;
    }
    params = {
        "product_id": product_id,
        "customer_id": getCookie('customer_id'),
        "enquiry_list_id": getCookie("enquiry_list_id"),
        "quantity": quantity,
        "stage": stage || "enquired"
    }
    ajaxRequestWithData("/object/interaction", "POST", JSON.stringify(params), function(data) {
        sync_enquiry_list({'_async': true});
        if (callbackFunc) {
            callbackFunc(data);
        }
    }, errorFunc);
    if ( params["stage"] == "opened" ) {
        setCookie("selected_product_id", product_id)
        if (!getCookie("product_viewed") ) {
            patch_customer({"product_viewed": true, "_async": true})
            setCookie("product_viewed", true);
        }
    } else if ( params["stage"] == "viewed" ) {
        if ( !getCookie("quick_viewed") ) {
            patch_customer({"quick_viewed": true, "_async": true})
            setCookie("quick_viewed", true);
        }
    } else {
        if ( !getCookie("added_enquiry_list") ) {
            patch_customer({"added_enquiry_list": true, "_async": true})
            setCookie("added_enquiry_list", true);
        }
    }
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


function ajaxRequestSync(URL, METHOD, callbackFunc, errorFunc, async, unauthorized, HEADERS){
    HEADERS = HEADERS || getCookie("authentication");
    if(!unauthorized) {
        unauthorized = function() {
            signup({}, ajaxRequestSync(URL, METHOD, callbackFunc, errorFunc, async, function() {
                console.log("Failed after signup");
                alert("Could not signup! Please contact customer support!");
            }, HEADERS));
        }
    }
    $.ajax({
        url: BASE_URL + URL,
        method: (METHOD || "GET").toUpperCase(),
        dataType: "json",
        contentType: "json",
        async: async || false,
        headers: HEADERS,
        statusCode: {
            401: unauthorized,
            404: unauthorized
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

function ajaxRequest(URL,METHOD,callbackFunc,errorFunc, unauthorized, HEADERS){
    return ajaxRequestSync(URL, METHOD, callbackFunc, errorFunc, true, unauthorized, HEADERS);
}

function ajaxRequestWithData(URL, METHOD, DATA, callbackFunc, errorFunc, unauthorized, HEADERS){
    HEADERS = HEADERS || getCookie("authentication");
    var defaultData="" ;
    if(DATA){
        defaultData=DATA;
    }
    if(!unauthorized) {
        unauthorized = function() {
            signup({}, ajaxRequestWithData(URL, METHOD, DATA, callbackFunc, errorFunc, function() {
                console.log("Failed after signup");
                alert("Could not signup! Please contact customer support!");
            }, HEADERS));
        }
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
