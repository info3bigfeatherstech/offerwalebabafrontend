import { useEffect, useState } from "react";

const useGeoLocation =  (lat, lon) => {
    const [data, setdata] = useState({})
    async function getDirections(){
         try {
    const res = await fetch(
      `https://us1.locationiq.com/v1/reverse.php?key=${import.meta.env.VITE_LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lon}&format=json&addressdetails=1&extratags=1&namedetails=1`
    );
    const data = await res.json();
    setdata(data)

  } catch (err) {
    console.error(err);
  }
    
}

    useEffect(()=>{
        getDirections();
    }, [lat, lon])
    return { data };
};

export default useGeoLocation