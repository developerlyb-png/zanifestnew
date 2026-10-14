"use client";

import React, {
  useEffect,
  useState
} from "react";

import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";

import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

import {
  BsCalendar3,
  BsFuelPumpDiesel
} from "react-icons/bs";

import axios from "axios";


interface VehicleVariantDialogProps {

  onClose: () => void;

  vehicleNumber: string;

  selectedBrand: string;

  selectedModel: string;

  selectedFuel: string;

  selectedYear: number | null;

  selectedLocation: any;
selectedVehicle:string;
  onBackToModel: () => void;

  onSelectVariant: (variant: string) => void;

}


const VehicleVariantDialog:
React.FC<VehicleVariantDialogProps> = ({

vehicleNumber,

selectedBrand,

selectedModel,

selectedFuel,

selectedYear,

selectedLocation,
selectedVehicle,

onBackToModel,

onSelectVariant

})=>{

const [search,setSearch] =
useState("");


const [activeVariant,setActiveVariant] =
useState("");


const [variants,setVariants] =
useState<any[]>([]);





// ===========================
// GET ZUNO VARIANTS
// ===========================


useEffect(()=>{


if(
!selectedBrand ||
!selectedModel
)
return;



const getVariants = async()=>{


try{


const response =
await axios.get(

"/api/zuno/4w/variant",

{

params:{

make:selectedBrand,

model:selectedModel

}

}

);



console.log(
"FULL VARIANT RESPONSE",
response.data
);




let list:any[] =


response.data?.variantList ||

response.data?.variants ||

response.data?.data ||

response.data ||

[];




// if object convert array

if(!Array.isArray(list)){

list = Object.values(list);

}




console.log(
"BEFORE FUEL FILTER",
list
);


// ============================
// ZUNO FUEL FILTER FIX
// ============================


if(selectedFuel){


// Zuno variant names usually don't mention fuel ("MAGNA", "GLS ASTA"),
// so only drop a variant when its fuel is known to be a different one:
// an explicit fuel field that doesn't match, or a name naming another fuel.
const fuelOf = (s:string)=>{
const t = s.toLowerCase();
if(/cng|lpg/.test(t)) return "cng";
if(/electric|\bev\b/.test(t)) return "electric";
if(/diesel|crdi|\btdi\b|\bdi\b/.test(t)) return "diesel";
if(/petrol/.test(t)) return "petrol";
return "";
};

const wanted = fuelOf(selectedFuel) || selectedFuel.toLowerCase();

list = list.filter(
(item:any)=>{

const field = String(item.fuelType || item.fuel || "");

if(field){
return fuelOf(field) === wanted || field.toLowerCase() === wanted;
}

const nameFuel = fuelOf(String(item.variant || item.variantName || ""));

return !nameFuel || nameFuel === wanted;

}

);


}



console.log(
"FINAL VARIANT LIST",
list
);



setVariants(list);



}

catch(error:any){


console.log(

"VARIANT API ERROR",

error.response?.data ||

error

);


setVariants([]);


}


};



getVariants();



},[

selectedBrand,

selectedModel,

selectedFuel

]);







const filteredVariants =

variants.filter((item:any)=>{


const name =

item.variant ||

item.variantName ||

item.Variant ||

item.name ||

item;



return String(name)

.toLowerCase()

.includes(

search.toLowerCase()

);


});







return (

<div className={styles.overlay}>


<div className={styles.dialog}>


{/* LEFT */}


<div className={styles.left}>


<h3 className={styles.leftTitle}>

Your Selection

</h3>



<div className={styles.selectionBox}>


<div className={styles.selectionItem}>

<FiMapPin className={styles.icon}/>

{
selectedLocation?.rto ||

vehicleNumber?.substring(0,4) ||

""
}


<span className={styles.editIcon}>

✎

</span>


</div>





<div className={styles.selectionItem}>


<BsCalendar3 className={styles.icon}/>


{
selectedYear ||

new Date().getFullYear()
}


<span className={styles.editIcon}>

✎

</span>


</div>





<div className={styles.selectionItem}>

<FaCar className={styles.icon}/>

{selectedBrand}

</div>





<div className={styles.selectionItem}>

<FaCar className={styles.icon}/>

{selectedModel}

</div>






<div className={styles.selectionItem}>

<BsFuelPumpDiesel className={styles.icon}/>

{selectedFuel}

</div>



</div>


</div>






{/* RIGHT */}


<div className={styles.right}>


<div
  className={styles.header}
  style={{
    position: "relative",
    display: "flex",
    alignItems: "center",
  }}
>

  <button
    className={styles.arrowBtn}
    onClick={onBackToModel}
  >
    ‹
  </button>

  <span
    style={{
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      whiteSpace: "nowrap",
    }}
  >
    Select Vehicle Variant
  </span>

</div>






<div className={styles.searchBox}>


<FiSearch className={styles.searchIcon}/>


<input

placeholder="Search Vehicle Variant"

value={search}

onChange={(e)=>

setSearch(e.target.value)

}

/>


</div>








<div className={styles.variantGrid}>


{


filteredVariants.map(

(item:any,index:number)=>{



const variantName =


item.variant ||

item.variantName ||

item.Variant ||

item.name ||

item;



return (


<button

key={index}


className={`${styles.variantBtn} ${
activeVariant===variantName
?
styles.active
:
""
}`}


onClick={()=>{


setActiveVariant(
variantName
);


onSelectVariant(
variantName
);


}}

>


<div className={styles.variantName}>


{variantName}


</div>


</button>


)


}

)


}


</div>



</div>



</div>


</div>


)


};



export default VehicleVariantDialog;