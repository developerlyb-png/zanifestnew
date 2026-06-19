"use client";

import React, { useMemo, useState } from "react";

import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";

import {
  FiArrowLeft,
  FiSearch
} from "react-icons/fi";

import {
  City
} from "country-state-city";



interface Props {

onBack:()=>void;

onClose:()=>void;

vehicleNumber:string;

selectedVehicle:string|null;

selectedBrand:string|null;

selectedModel:string|null;

selectedVariant:string|null;

onSelectRto:(data:any)=>void;

}





const RtoDialog:React.FC<Props> = ({

onBack,

onSelectRto,

selectedVehicle,

selectedBrand,

selectedModel,

selectedVariant

})=>{



const [search,setSearch] =
useState("");



const [rtoList,setRtoList] =
useState<any[]>([]);







// ======================
// INDIA CITY LIST
// ======================


const cityList =
useMemo(()=>{


const cities =

City
.getCitiesOfCountry("IN")
?.map((item)=>

item.name.toUpperCase()

) || [];



return [

...new Set(cities)

].sort();



},[]);







// ======================
// FILTER CITY
// ======================


const filteredCities =

cityList.filter((city)=>

city
.toLowerCase()
.includes(
search.toLowerCase()
)

);







return(

<div className={styles.overlay}>


<div className={styles.dialog}>



{/* LEFT */}

<div className={styles.left}>


<h3>
Your selection
</h3>



<div className={styles.infoBox}>


<p>{selectedVehicle}</p>

<p>{selectedBrand}</p>

<p>{selectedModel}</p>

<p>{selectedVariant}</p>


</div>


</div>









{/* RIGHT */}


<div className={styles.right}>



<div className={styles.header}>


<FiArrowLeft

onClick={()=>{


if(rtoList.length > 0){


setRtoList([]);


}
else{


onBack();


}


}}

/>



<span>


{
rtoList.length > 0
?
"Select RTO"
:
"Select IDV City"
}


</span>



</div>









{/* SEARCH */}


<div className={styles.searchBox}>


<FiSearch/>


<input

placeholder={
rtoList.length > 0
?
"Search RTO"
:
"Search city"
}


value={search}


onChange={(e)=>

setSearch(

e.target.value

)

}


/>


</div>









<div className={styles.variantGrid}>



{


(
rtoList.length > 0
?
rtoList.filter((rto)=>{


return (

rto.rtolocation+

rto.rtocityordistrict

)

.toLowerCase()

.includes(

search.toLowerCase()

);


})
:
filteredCities

)


.map((item:any)=>(




<button


key={

rtoList.length > 0

?

item.rtolocation

:

item

}


className={styles.variantBtn}




onClick={async()=>{






// ======================
// FINAL RTO SELECT
// ======================


if(rtoList.length > 0){



console.log(

"FINAL SELECTED RTO",

item

);




onSelectRto(item);



return;


}









// ======================
// CITY SELECT
// ======================


try{



const res =

await fetch(

`/api/zuno/cv/rto-by-city?city=${encodeURIComponent(item)}`

);



const data =

await res.json();





console.log(

"RTO RESPONSE",

data

);







if(

Array.isArray(data)

&&

data.length > 0

){



setSearch("");

setRtoList(data);



}

else{


alert(

"No RTO found"

);


}



}

catch(error){



console.log(

"RTO ERROR",

error

);



alert(

"RTO API Error"

);



}



}}


>




<div>


<strong>


{

rtoList.length > 0

?

`${item.rtolocation} - ${item.rtocityordistrict}`

:

item

}


</strong>


</div>




<span>

›

</span>



</button>




))


}



</div>









<div className={styles.helpBox}>


<h3>

Need help finding your vehicle?

</h3>


<button>

Contact us

</button>


</div>






</div>



</div>


</div>


);



};




export default RtoDialog;