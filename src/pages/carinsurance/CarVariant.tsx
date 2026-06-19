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


list = list.filter(
(item:any)=>{


const text = String(

item.variant ||

item.variantName ||

item.fuelType ||

item.fuel ||

""

).toLowerCase();



return text.includes(

selectedFuel.toLowerCase()

);


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

vehicleNumber.substring(0,4)
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


<div className={styles.header}>


<button

className={styles.arrowBtn}

onClick={onBackToModel}

>

‹

</button>



<span>

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