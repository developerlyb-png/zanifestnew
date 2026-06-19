"use client";

import React, {
  useEffect,
  useState
} from "react";

import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";

import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { BiGasPump } from "react-icons/bi";
import { GiGearStickPattern } from "react-icons/gi";
import { BsCalendar3 } from "react-icons/bs";

import axios from "axios";


interface SelectFuelTypeProps {

  onClose:()=>void;

  vehicleNumber:string;

  selectedVehicle:string;

  selectedBrand:string;

  selectedModel:string;

  selectedVariant:string;

  selectedFuel:string;

  selectedYear:number|null;

  selectedLocation:any;

  onBackToModel:()=>void;

  onNextToVariant:()=>void;

  onSelectFuel:(fuel:string)=>void;

}



const SelectFuelType:
React.FC<SelectFuelTypeProps> = ({

vehicleNumber,

selectedBrand,

selectedModel,

selectedVariant,

selectedFuel,

selectedYear,

selectedLocation,

onBackToModel,

onNextToVariant,

onSelectFuel

})=>{


const [search,setSearch] =
useState("");


const [activeFuel,setActiveFuel] =
useState("");


const [fuelTypes,setFuelTypes] =
useState<string[]>([]);




// ==============================
// GET FUEL FROM VARIANT MASTER
// ==============================


useEffect(()=>{


if(
!selectedBrand ||
!selectedModel
)
return;



const getFuel = async()=>{


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
"FUEL RAW RESPONSE",
response.data
);



let list:any[] =

response.data?.variantList ||

response.data?.data ||

response.data ||

[];




if(!Array.isArray(list)){

list = Object.values(list);

}



// extract fuel from variant name

const fuels = new Set<string>();


list.forEach((item:any)=>{


const variant =

String(

item.variant ||

item.variantName ||

""

).toUpperCase();




if(
variant.includes("PETROL")
){

fuels.add("Petrol");

}


if(
variant.includes("DIESEL")
){

fuels.add("Diesel");

}


if(
variant.includes("CNG")
){

fuels.add("CNG");

}


if(
variant.includes("ELECTRIC") ||
variant.includes("EV")
){

fuels.add("Electric");

}


});



// fallback
if(fuels.size===0){

fuels.add("Petrol");

fuels.add("Diesel");

}



const finalFuel =
Array.from(fuels);



console.log(
"FINAL FUEL LIST",
finalFuel
);



setFuelTypes(finalFuel);



}

catch(error:any){


console.log(

"FUEL ERROR",

error.response?.data ||
error

);


setFuelTypes([]);


}



};



getFuel();



},[

selectedBrand,

selectedModel

]);








const filteredFuel =

fuelTypes.filter((fuel)=>


fuel.toLowerCase()
.includes(

search.toLowerCase()

)

);







return (

<div className={styles.overlay}>


<div className={styles.dialog}>


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

</div>



<div className={styles.selectionItem}>

<BsCalendar3 className={styles.icon}/>

{
selectedYear ||
new Date().getFullYear()
}

</div>



<div className={styles.selectionItem}>

<FaCar className={styles.icon}/>

{selectedBrand}

</div>



<div className={styles.selectionItem}>

<FaCar className={styles.icon}/>

{selectedModel}

</div>



{
selectedFuel &&

<div className={styles.selectionItem}>

<BiGasPump className={styles.icon}/>

{selectedFuel}

</div>

}



{
selectedVariant &&

<div className={styles.selectionItem}>

<GiGearStickPattern className={styles.icon}/>

{selectedVariant}

</div>

}


</div>


</div>






<div className={styles.right}>


<div className={styles.header}>


<button

className={styles.arrowBtn}

onClick={onBackToModel}

>

‹

</button>


<span>

Select Fuel Type

</span>



<button

className={styles.arrowBtn}

onClick={()=>{


if(activeFuel)

onNextToVariant();


}}

>

›

</button>


</div>






<div className={styles.searchBox}>


<FiSearch className={styles.searchIcon}/>


<input

placeholder="Search fuel type"

value={search}

onChange={(e)=>

setSearch(e.target.value)

}

/>


</div>







<div className={styles.variantGrid}>


{


filteredFuel.map((fuel,index)=>(


<button

key={index}

className={`${styles.variantBtn} ${
activeFuel===fuel
?
styles.active
:
""
}`}


onClick={()=>{


setActiveFuel(fuel);


onSelectFuel(fuel);


}}

>


<div className={styles.variantName}>

{fuel}

</div>


</button>


))


}


</div>



</div>



</div>


</div>


);


};



export default SelectFuelType;