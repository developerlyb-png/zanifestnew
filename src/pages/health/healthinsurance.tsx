"use client";

import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

import React, { useState } from "react";

import Image from "next/image";

import { FaChevronRight } from "react-icons/fa6";

import { useRouter } from "next/router";

import styles from "@/styles/pages/healthinsurance.module.css";


const MEMBERS = [

 {
  id:1,
  name:"Self",
  maleImg:require("@/assets/pageImages/health/1.webp"),
  femaleImg:require("@/assets/pageImages/health/2.webp")
 },

 {
  id:2,
  name:"Spouse",
  maleImg:require("@/assets/pageImages/health/2.webp"),
  femaleImg:require("@/assets/pageImages/health/1.webp")
 },


 {
  id:3,
  name:"Son",
  maleImg:require("@/assets/pageImages/health/3.webp"),
  femaleImg:require("@/assets/pageImages/health/3.webp")
 },


 {
  id:4,
  name:"Daughter",
  maleImg:require("@/assets/pageImages/health/4.webp"),
  femaleImg:require("@/assets/pageImages/health/4.webp")
 },


 {
  id:5,
  name:"Father",
  maleImg:require("@/assets/pageImages/health/5.webp"),
  femaleImg:require("@/assets/pageImages/health/5.webp")
 },


 {
  id:6,
  name:"Mother",
  maleImg:require("@/assets/pageImages/health/6.webp"),
  femaleImg:require("@/assets/pageImages/health/6.webp")
 },


 {
  id:7,
  name:"Grandfather",
  maleImg:require("@/assets/pageImages/health/grandfather.png"),
  femaleImg:require("@/assets/pageImages/health/grandfather.png")
 },


 {
  id:8,
  name:"Grandmother",
  maleImg:require("@/assets/pageImages/health/old-woman.png"),
  femaleImg:require("@/assets/pageImages/health/old-woman.png")
 },


 {
  id:9,
  name:"Father-in-law",
  maleImg:require("@/assets/pageImages/health/man.png"),
  femaleImg:require("@/assets/pageImages/health/man.png")
 },


 {
  id:10,
  name:"Mother-in-law",
  maleImg:require("@/assets/pageImages/health/woman.png"),
  femaleImg:require("@/assets/pageImages/health/woman.png")
 }

];





function HealthInsurance(){


const router = useRouter();


const [selectedMan,setSelectedMan] =
useState(true);


const [selectedMembers,setSelectedMembers] =
useState<number[]>([]);



const [memberCounts,setMemberCounts] =
useState<{[key:number]:number}>({});



const [showMore,setShowMore] =
useState(false);





const getAdjustedMembers=()=>{


return MEMBERS.map((m)=>{


if(m.id===1){

return {
...m,
name:"Self",
image:selectedMan ? m.maleImg:m.femaleImg
};

}



if(m.id===2){

return {
...m,
name:selectedMan ? "Wife":"Husband",
image:selectedMan ? m.maleImg:m.femaleImg
};

}



return {
...m,
image:selectedMan ? m.maleImg:m.femaleImg
};


});


};






const handleSelect=(id:number)=>{


if(id===3 || id===4){


setMemberCounts(prev=>({

...prev,

[id]:prev[id] || 1

}));


if(!selectedMembers.includes(id)){

setSelectedMembers([
...selectedMembers,
id
]);

}


}

else{


setSelectedMembers(prev=>

prev.includes(id)

?

prev.filter(x=>x!==id)

:

[...prev,id]

);


}



};





const increaseCount=(id:number)=>{


setMemberCounts(prev=>({

...prev,

[id]:(prev[id]||1)+1

}));

};




const decreaseCount=(id:number)=>{


setMemberCounts(prev=>{


const count=prev[id]||1;


if(count>1){


return {

...prev,

[id]:count-1

};


}


const updated={...prev};

delete updated[id];


setSelectedMembers(
s=>s.filter(x=>x!==id)
);


return updated;


});


};






const handleContinue=()=>{


if(
!selectedMembers.includes(1)
&&
!selectedMembers.includes(2)
){

alert(
"Please select Self or Wife/Husband"
);

return;

}



const adjusted=getAdjustedMembers();



const selected = adjusted

.filter(m=>
selectedMembers.includes(m.id)
)

.flatMap(m=>{


const count =
memberCounts[m.id] || 1;



return Array(count)
.fill(null)
.map(()=>({


/*
old health.tsx support
*/
name:m.name,


image:
m.image.src || m.image,


/*
zuno api support
*/
relation:m.name,


age:"",


gender:

[
"Wife",
"Mother",
"Daughter",
"Grandmother",
"Mother-in-law"
]
.includes(m.name)

?
"F"

:
"M"


}));


});





router.push({

pathname:"./health",

query:{

gender:
selectedMan ? "M":"F",


members:
JSON.stringify(selected)

}


});



};








return(

<div>


<UserDetails/>

<Navbar/>




<div className={styles.cont}>


<div className={styles.head}>


<h2 className={styles.heading}>

Find top plans for you

</h2>




<div className={styles.switchCont}>


<button

className={`${styles.switch} ${selectedMan ? styles.selectedSwitch:""}`}

onClick={()=>setSelectedMan(true)}

>

Male

</button>




<button

className={`${styles.switch} ${!selectedMan ? styles.selectedSwitch:""}`}

onClick={()=>setSelectedMan(false)}

>

Female

</button>



</div>


<p style={{
fontWeight:"bold",
marginTop:"20px"
}}>

Select member(s) you want to insure

</p>


</div>






<div className={styles.middle}>


{
getAdjustedMembers()
.slice(0,6)
.map(item=>(



<div
key={item.id}
className={styles.itemWrapper}
>



<button

className={`${styles.item} ${
selectedMembers.includes(item.id)
?
styles.selectedItem
:
""
}`}

onClick={()=>handleSelect(item.id)}

>


<Image

src={item.image}

alt={item.name}

className={styles.itemImage}

/>


<h3 className={styles.itemName}>

{item.name}

</h3>



</button>





{
(item.id===3 || item.id===4)
&&
selectedMembers.includes(item.id)
&&


<div className={styles.counter}>


<button
onClick={()=>decreaseCount(item.id)}
>
-
</button>


<span>

{memberCounts[item.id] || 1}

</span>


<button
onClick={()=>increaseCount(item.id)}
>
+
</button>


</div>


}




</div>


))
}


</div>





{
showMore &&


<div className={styles.middle}>


{

getAdjustedMembers()
.slice(6)
.map(item=>(


<button

key={item.id}

className={`${styles.item} ${
selectedMembers.includes(item.id)
?
styles.selectedItem
:
""
}`}


onClick={()=>handleSelect(item.id)}

>


<Image

src={item.image}

alt={item.name}

className={styles.itemImage}

/>


<h3>

{item.name}

</h3>


</button>


))

}


</div>


}




<p

className={styles.moreLink}

onClick={()=>setShowMore(!showMore)}

>

{
showMore
?
"Show less"
:
"More members ▼"
}

</p>





<button

className={styles.continueButton}

onClick={handleContinue}

>

Continue

<FaChevronRight size={10}/>

</button>





<p className={styles.disclamir}>

By clicking on Continue, you agree to our terms.

</p>



</div>



<Footer/>


</div>


);


}



export default HealthInsurance;