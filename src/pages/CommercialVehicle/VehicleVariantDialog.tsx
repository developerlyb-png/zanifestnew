"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "@/styles/pages/CommercialVehicle/VehicleVariantDialog.module.css";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { FaTruck, FaCar } from "react-icons/fa";

interface VehicleVariantDialogProps {
  onClose: () => void;
  vehicleNumber: string;
  selectedVehicle: string;
  selectedBrand: string;
  selectedModel: string;
  onBackToModel: () => void;
  onNextToYear: () => void;
  onSelectVariant: (variant: string) => void;
}

const VehicleVariantDialog: React.FC<VehicleVariantDialogProps> = ({
  vehicleNumber,
  selectedVehicle,
  selectedBrand,
  selectedModel,
  onSelectVariant,
  onBackToModel,
  onNextToYear,
}) => {

const [search,setSearch] = useState("");

const [variants,setVariants] =
useState<string[]>([]);



useEffect(()=>{

if(
selectedBrand &&
selectedModel
){

getVariants();

}

},[
selectedBrand,
selectedModel
]);





const getVariants = async()=>{

try{


const res =
await axios.get(
`/api/zuno/cv/variant?make=${selectedBrand}&model=${selectedModel}`
);


console.log(
"CV VARIANTS",
res.data
);



// object se string nikalo

const variantList =
res.data.map(
(item:any)=>item.variant
);



setVariants(
variantList
);



}
catch(error){

console.log(
"VARIANT ERROR",
error
);

}

};




return (

<div className={styles.overlay}>

<div className={styles.dialog}>


{/* LEFT */}
<div className={styles.left}>

<h3 className={styles.leftTitle}>
Your selection
</h3>


<div className={styles.selectionBox}>

<div className={styles.selectionItem}>
<FiMapPin className={styles.icon}/>
{vehicleNumber}
</div>


<div className={styles.selectionItem}>
<FaTruck className={styles.icon}/>
{selectedVehicle}
</div>


<div className={styles.selectionItem}>
<FaCar className={styles.icon}/>
{selectedBrand}
</div>


<div className={styles.selectionItem}>
<FaCar className={styles.icon}/>
{selectedModel}
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
Search Vehicle Variant
</span>


<button
className={styles.arrowBtn}
onClick={onNextToYear}
>
›
</button>


</div>




<div className={styles.searchBox}>

<FiSearch className={styles.searchIcon}/>

<input
type="text"
placeholder="Search Vehicle Variant"
value={search}
onChange={(e)=>
setSearch(e.target.value)
}
/>

</div>





<div className={styles.variantGrid}>


{variants

.filter((v)=>

v.toLowerCase()
.includes(
search.toLowerCase()
)

)

.map((variant,i)=>(


<button

key={i}

className={styles.variantBtn}

onClick={()=>{

onSelectVariant(
variant
);

}}

>


<div className={styles.variantName}>

{variant}

</div>


<span className={styles.arrow}>
›
</span>


</button>


))}


</div>


</div>


</div>

</div>

);

};


export default VehicleVariantDialog;