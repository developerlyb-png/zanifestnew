"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/pages/TwoWheeler/twowheel.module.css";
import Image from "next/image";
import scooterImg from "@/assets/motorcycle.png";

import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

import AOS from "aos";
import "aos/dist/aos.css";


// YEARS

const currentYear =
new Date().getFullYear();


const years =
Array.from(
{length:20},
(_,i)=> currentYear - 1 - i
);

// MAKES

const makes = [

{ name:"Honda", image:require("@/assets/home/hondacar.png") },

{ name:"Bajaj", image:require("@/assets/home/bajaj logo.png") },

{ name:"TVS", image:require("@/assets/home/tvs logo.png") },

{ name:"Yamaha", image:require("@/assets/home/yamaha.png") },

{ name:"Hero Motorcorp", image:require("@/assets/home/hero (2).png") },

{ name:"Royal Enfield", image:require("@/assets/home/royal logo.png") },

{ name:"Suzuki", image:require("@/assets/home/SuzukiLogo (2).png") },

{ name:"Mahindra", image:require("@/assets/home/Mahindra.png") },

{ name:"KTM", image:require("@/assets/home/ktm.png") },

{ name:"LML", image:require("@/assets/home/lml.png") },

{ name:"Ola", image:require("@/assets/home/ola.png") },

{ name:"Harley Davidson", image:require("@/assets/home/harley.png") },

];




// MODELS

const modelList:any={


Honda:{

popular:[
"ACTIVA",
"CB SHINE",
"CB UNICORN"
],

other:[
"DIO",
"AVIATOR"
]

},



Bajaj:{

popular:[
"AVENGER 220 CRUISE"
],

other:[
"PULSAR",
"PLATINA",
"CT 100"
]

}


};






export default function TwoWheeler(){


const router =
useRouter();



const [step,setStep] =
useState<
"years" |
"makes" |
"models" |
"vehicleDetails"
>("years");



const [selectedYear,setSelectedYear] =
useState("");

const [selectedMake,setSelectedMake] =
useState("");

const [selectedModel,setSelectedModel] =
useState("");



const [engineNumber,setEngineNumber] =
useState("");

const [chassisNumber,setChassisNumber] =
useState("");






useEffect(()=>{

AOS.init({
duration:1000,
once:true
});

},[]);




useEffect(()=>{

AOS.refresh();

},[step]);







return(

<div>


<UserDetails/>

<Navbar/>




<div className={styles.container}>



<div className={styles.leftSection}>


<div className={styles.imageWrapper}>


<Image

src={scooterImg}

alt="Scooter"

className={styles.image}

priority

/>


</div>


</div>







<div className={styles.rightSection}>





{/* YEAR */}


{step==="years" &&


<div data-aos="fade-left">


<h2 className={styles.question}>

When did you buy your Bike/Scooter?

</h2>



<div className={styles.yearGrid}>
<div
className={styles.yearButton}

onClick={()=>{

setSelectedYear(
String(currentYear)
);


localStorage.setItem(
"isNewBike",
"true"
);


setStep("makes");

}}

>

Brand New Bike  ›

</div>

{years.map((year)=>(


<button

key={year}

className={styles.yearButton}

onClick={()=>{


setSelectedYear(
String(year)
);


localStorage.setItem(
"isNewBike",
"false"
);


setStep("makes");


}}

>

{year}

</button>


))}


</div>


</div>

}








{/* MAKE */}


{step==="makes" &&


<div
data-aos="fade-left"
className={styles.makesWrapper}
>


<button

className={styles.backButton}

onClick={()=>setStep("years")}

>

<FaArrowLeft/>

</button>



<h3>
Select two wheeler make
</h3>



<input

type="text"

placeholder="Search two wheeler make"

className={styles.searchInput}

/>



<p className={styles.popularTitle}>

Popular makes

</p>




<div className={styles.grid}>


{makes.map((make,index)=>(


<div

key={index}

className={styles.makeCard}

onClick={()=>{


setSelectedMake(
make.name
);


setStep("models");


}}

>


<div className={styles.makeImageWrapper}/>


<span className={styles.makeText}>

{make.name}

</span>


</div>


))}


</div>



<p className={styles.searchText}>

Can’t find your bike’s make? Click here to search

</p>


</div>


}










{/* MODELS */}



{step==="models" &&


<div
data-aos="fade-left"
className={styles.modelsWrapper}
>



<button

className={styles.backButton}

onClick={()=>setStep("makes")}

>

<FaArrowLeft/>

</button>




<h3 className={styles.title}>

Select two wheeler model

</h3>




<input

type="text"

placeholder={`Search ${selectedMake} two wheeler model`}

className={styles.searchInput}

/>







<p className={styles.sectionTitle}>

Popular models

</p>



<div className={styles.grids}>


{(modelList[selectedMake]?.popular || [])
.map((model:any,index:number)=>(


<div

key={index}

className={styles.modelCard}

onClick={()=>{


setSelectedModel(model);


setStep("vehicleDetails");


}}

>

{model}

</div>


))}


</div>







<p className={styles.sectionTitle}>

Other models

</p>




<div className={styles.grids}>


{(modelList[selectedMake]?.other || [])
.map((model:any,index:number)=>(


<div

key={index}

className={styles.modelCard}

onClick={()=>{


setSelectedModel(model);


setStep("vehicleDetails");


}}

>

{model}

</div>


))}


</div>



</div>


}











{/* ENGINE + CHASSIS */}



{step==="vehicleDetails" &&


<div

data-aos="fade-left"

className={styles.modelsWrapper}

>



<button

className={styles.backButton}

onClick={()=>setStep("models")}

>

<FaArrowLeft/>

</button>




<h3>

Enter Vehicle Details

</h3>




<input

type="text"

placeholder="Engine Number"

className={styles.searchInput}

value={engineNumber}

onChange={(e)=>
setEngineNumber(
e.target.value
)
}

/>




<input

type="text"

placeholder="Chassis Number"

className={styles.searchInput}

value={chassisNumber}

onChange={(e)=>
setChassisNumber(
e.target.value
)
}

/>





<button

className={styles.yearButton}

onClick={()=>{


const vehicleData={


year:selectedYear,


make:selectedMake,


model:selectedModel,


vehicleNumber:
localStorage.getItem(
"vehicleNumber"
),


// ADD THIS
isNewBike:
localStorage.getItem(
"isNewBike"
),


engineNumber,


chassisNumber


};



localStorage.setItem(

"selectedBikeData",

JSON.stringify(vehicleData)

);




router.push(
"./twowheeler5"
);



}}

>

Continue

</button>



</div>


}





</div>


</div>




<Footer/>


</div>


);


}