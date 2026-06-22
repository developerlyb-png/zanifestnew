"use client";

import React,{
useEffect,
useState
} from "react";

import styles from "@/styles/pages/CommercialVehicle/VehicleModelDialog.module.css";

import {FiMapPin,FiSearch} from "react-icons/fi";
import {FaCar} from "react-icons/fa";
import {BsCalendar3} from "react-icons/bs";
import axios from "axios";


interface VehicleModelDialogProps{

onClose:()=>void;
vehicleNumber:string;
selectedVehicle:string;
selectedBrand:string;
selectedYear:number|null;
selectedLocation:any;

onSelectModel:(model:string)=>void;
onBack:()=>void;
onNext:()=>void;

}


const VehicleModelDialog:React.FC<VehicleModelDialogProps>=({

vehicleNumber,
selectedBrand,
selectedYear,
selectedLocation,
onSelectModel,
onBack,
onNext

})=>{


const [search,setSearch]=useState("");

const [activeModel,setActiveModel]=useState("");

const [models,setModels]=useState<any[]>([]);



useEffect(()=>{


if(!selectedBrand)return;


const getModels=async()=>{


try{


const res =
await axios.get(
"/api/zuno/4w/model",
{
params:{

make:selectedBrand

}
}
);


console.log(
"CAR MODEL DATA",
res.data
);


setModels(
res.data?.modelList ||
res.data?.data ||
res.data ||
[]
);


}
catch(err){

console.log(err);

}


};


getModels();


},[selectedBrand]);




const filteredModels=models.filter((m:any)=>{


const name =
m.model ||
m.modelName ||
m;


return name
.toLowerCase()
.includes(search.toLowerCase());


});



return (

<div className={styles.overlay}>

<div className={styles.dialog}>


<div className={styles.left}>


<h3 className={styles.leftTitle}>
Your selection
</h3>


<div className={styles.selectionBox}>


<div className={styles.selectionItem}>

<FiMapPin className={styles.icon}/>

{selectedLocation?.rto ||
vehicleNumber.substring(0,4)}

</div>


<div className={styles.selectionItem}>

<BsCalendar3 className={styles.icon}/>

{selectedYear}

</div>


<div className={styles.selectionItem}>

<FaCar className={styles.icon}/>

{selectedBrand}

</div>


</div>

</div>





<div className={styles.right}>


<div className={styles.header}>


<button
className={styles.arrowBtn}
onClick={onBack}
>
‹
</button>


<span>
Search car Model
</span>


<button
className={styles.arrowBtn}
onClick={()=>{

if(activeModel)
onNext();

}}
>
›
</button>


</div>




<div className={styles.searchBox}>

<FiSearch/>

<input

placeholder="Search car Model"

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

/>

</div>




<div className={styles.modelsGrid}>


{

filteredModels.map((item:any,i)=>{


const model =
item.model ||
item.modelName ||
item;



return (

<button

key={i}

className={`${styles.modelBtn}
${activeModel===model?styles.active:""}`}


onClick={()=>{


setActiveModel(model);


onSelectModel(model);


}}

>

{model}

<span>›</span>


</button>


)

})


}


</div>


</div>


</div>

</div>


)


}


export default VehicleModelDialog;