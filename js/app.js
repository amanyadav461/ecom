/* 


clearDropDown.addEventListener('change', () => {
    var prValue = clearDropDown.options[clearDropDown.selectedIndex].value;
});

function prAlert(){
    alert(prValue);
} */


// const priceDropDown = document.getElementById("Price");
// const clearDropDown = document.querySelector(".Clear"); 
// const quickView  = document.querySelector("btn");


// function prAlert() {
//     var prValue = priceDropDown.options[priceDropDown.selectedIndex].value;
//     alert(prValue)
// }

// prAlert();

function prAlert(){
    $(document).ready(function(){
        $("select.pricedropdown").change(function(){
            var productSorting = $(this).children("option:selected").val();
            alert(productSorting);
        });
    });
}

//for third page
function imageViewer(smallImg){
    var bigImg = document.getElementById("imgBox");
    bigImg.src = smallImg.src;
}

//for fifth page
function imgCarousel(minImg){
    var maxImg = document.getElementById("pg5ImgBox");
    maxImg.src = minImg.src;
}

//page 5 read more 0r less

var i=0;
function read(){
    if(!i){
        document.getElementById("moretext").style.display = "inline";
        document.getElementById("more").style.display = "inline";
        document.getElementById("readBtn").innerHTML= "Read Less";
        i=1;
    }
    else {
        document.getElementById("moretext").style.display = "none";
        document.getElementById("more").style.display = "none";
        document.getElementById("readBtn").innerHTML= "Read More";
        i=0;
    }
}

//pop up
// yeh quick view popup ke liye likha tha dekh esse kuch hoga to
/*
var quickView = document.getElementById("quickView");
var qvButton = document.getElementById("quickviewBtn");

qvButton.onclick = function() {
    quickView.style.display = "inline";
}

var span = document.getElementsByClassName("close")[0];

span.onclick = function() {
    quickView.style.display = "none";
}
*/