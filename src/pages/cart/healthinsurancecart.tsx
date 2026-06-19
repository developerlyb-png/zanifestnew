"use client";

import React, { useState } from "react";

import styles from "@/styles/pages/cart/healthinsurancecart.module.css";

import Image from "next/image";

import careLogo from "@/assets/liclogo.png";

import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

import axios from "axios";

import {
  useRouter
} from "next/router";


const HealthInsuranceCart = () => {


const router = useRouter();


const [selectedPeriod,setSelectedPeriod] =
useState("1");


const [loading,setLoading] =
useState(false);



// =============================
// GET PLAN FROM QUERY
// =============================

let plan:any = {};


try{

if(router.query.plan){

plan =
JSON.parse(
router.query.plan as string
);

}

}
catch(error){

console.log(
"PLAN PARSE ERROR",
error
);

}





// =============================
// PREMIUM + SUM INSURED
// =============================

const policyData =
plan?.primaryRatingObject?.policyData ||
plan?.rawData?.primaryRatingObject?.policyData;


const contract =
policyData?.contractDetails;


const premium =

contract
?.contractPremium
?.premiumAfterTax ||

contract
?.contractPremium
?.grossPremium ||

contract
?.contractPremium
?.netPremium ||

plan?.premium ||

"0";



const sumInsured =

contract
?.coveragePackage
?.coverage
?.sumInsured ||

plan?.sumInsured ||

"500000";



const totalPremium =
Number(premium) * Number(selectedPeriod);




// =============================
// FULL QUOTE API
// =============================


const createFullQuote =
async()=>{


try{


if(!router.query.plan){

alert(
"Plan data missing"
);

return;

}



setLoading(true);



const quickData =
JSON.parse(
router.query.plan as string
);




console.log(
"FULL QUOTE REQUEST",
quickData
);




const response =
await axios.post(

"/api/zuno/health/full-quote",

quickData

);





console.log(

"FULL QUOTE FINAL",

response.data

);





// send proposal data


router.push({

pathname:"/health/proposal",

query:{

proposal:

JSON.stringify(
response.data
)

}

});





}

catch(error:any){


console.log(

"FULL QUOTE ERROR",

error.response?.data ||

error

);



alert(

error.response?.data?.message ||

"Full quote failed"

);


}

finally{


setLoading(false);


}



};





return (

<div>


<UserDetails/>

<Navbar/>




<div className={styles.wrapper}>


<div className={styles.container}>



{/* LEFT */}


<div className={styles.left}>


<div className={styles.planCard}>


<div className={styles.planHeader}>


<Image

src={careLogo}

alt="Care Logo"

className={styles.logo}

/>



<div className={styles.planTitle}>


<h3>

{
plan?.planName ||
"Zuno Health"
}

</h3>



<p>

<span className={styles.link}>

View all features

</span>


{" "}•{" "}


<span className={styles.green}>

Cashless hospitals

</span>


</p>


</div>


</div>


</div>





<div className={styles.planCard}>


<div className={styles.section}>


<h4>

Cover Amount

</h4>


<select className={styles.selectInput}>


<option>

₹{sumInsured}

</option>


</select>



</div>


</div>








<div className={styles.planCard}>


<div className={styles.section}>


<h4>

Policy Period

</h4>




<div className={styles.periodOptions}>



<div

className={`${styles.option} ${
selectedPeriod==="1"
?
styles.selected
:
""
}`}


onClick={()=>
setSelectedPeriod("1")
}

>


<input

type="radio"

checked={
selectedPeriod==="1"
}

readOnly

/>


<span>

1 Year @ ₹{premium}

</span>


</div>





<div

className={`${styles.option} ${
selectedPeriod==="2"
?
styles.selected
:
""
}`}


onClick={()=>
setSelectedPeriod("2")
}

>


<input

type="radio"

checked={
selectedPeriod==="2"
}

readOnly

/>


<span>

2 Years @ ₹{Number(premium) * 2}

</span>


</div>






<div

className={`${styles.option} ${
selectedPeriod==="3"
?
styles.selected
:
""
}`}


onClick={()=>
setSelectedPeriod("3")
}

>


<input

type="radio"

checked={
selectedPeriod==="3"
}

readOnly

/>


<span>

3 Years @ ₹{Number(premium) * 3}

</span>


</div>




</div>


</div>


</div>



</div>







{/* RIGHT */}



<div className={styles.right}>


<div className={styles.summaryCard}>


<h4>

Summary

</h4>


<hr/>




<div className={styles.summaryRow}>


<span>

Premium - {selectedPeriod} year

</span>


<strong>

₹{totalPremium}

</strong>


</div>





<div>

<strong>

Select Rider(s)

</strong>

</div>



<div className={styles.summaryItem}>


<p className={styles.warning}>

Missing out on benefits

</p>


<span className={styles.link}>

View riders

</span>



</div>






<div>

<strong>

Select Add-ons

</strong>

</div>



<div className={styles.summaryItem}>


<p className={styles.warning}>

No add-ons selected

</p>


<span className={styles.link}>

View add-ons

</span>


</div>







<div className={styles.totalRow}>


<span>

Total premium ₹{totalPremium}

</span>


<strong>

₹{premium}

</strong>


</div>







<button

className={styles.proceedBtn}

onClick={createFullQuote}

disabled={loading}

>


{

loading

?

"Creating Quote..."

:

"Proceed to proposal"

}


</button>




</div>


</div>




</div>


</div>



<Footer/>


</div>

);


};


export default HealthInsuranceCart;