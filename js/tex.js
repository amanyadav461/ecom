 //######################### add to enquire list ######################
        $("#add_enq_list").on("click", function(){// When add to enquiry list is clicked
            // please make sure the product_id and product_quantity are filled from the form
            create_product_enquiry(product_id,product_quanity,"enquired",function(data){
                console.log(data); //
            }
        });



create_product_enquiry(product_id,product_quanity,"enquired",function(data){console.log(data)}; //this function is only used to store the product data that customer is interested or tried to go forward with it








// ############### enquire NOW ######################
        $("#enqNow").on("click", function(){ // Once enquire now is clicked
        //form gets poped
        //user fills the form
        //click on submit
        //validation is done
        //then the bellow code gets fired
        //patch customer for adding data which is entered into enquire now form
            patch_customer({"enquiry_placed": true,"name":,"company_name":,"designation_name":,"email":,"phone_number":,"address":},function(pdata){
        });
    });
       