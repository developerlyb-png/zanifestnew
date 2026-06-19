"use client";

import styles from "@/styles/pages/carinsurance.module.css";


const years=[
"Brand New Car",
"2025",
"2024",
"2023",
"2022",
"2021",
"2020",
"2019",
"2018",
"2017",
"2016",
"2015",
"2014",
"2013",
"2012",
"2011",
"2010",
"2009",
"2008",
"2007"
];


export default function CarYearDialog({
location,
onEditLocation,
onSelectYear,
onClose
}:any){


return (

<div className={styles.vehicleModal}>


<div className={styles.vehicleLeft}>


<h2>
Your selection
</h2>


<div className={styles.selectedBox}>


<span>

📍 {location?.state}
 {location?.rto}

</span>


<button
className={styles.editBtn}
onClick={onEditLocation}
>
✎
</button>


</div>


</div>



<div className={styles.vehicleRight}>


<h2>

<button onClick={onClose}>
‹
</button>

Car registration Year

</h2>



<div className={styles.yearGrid}>


{
years.map((year)=>(


<button
key={year}
className={styles.yearItem}
onClick={()=>
onSelectYear(year)
}
>

{year} ›


</button>


))
}


</div>


</div>



</div>

)

}