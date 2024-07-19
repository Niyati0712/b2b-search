// MultipleSearch.jsx

import React, { useState,useCallback, useContext } from "react";
import "./MultipleSearch.css";
import Button from "../Button/Button";
import Input from "../Input/Input";
import GoogleLogin from "../GoogleLogin/GoogleLogin";
import Loader from "../Loader/Loader";
import toast from "react-hot-toast";
import AuthContext from "../../context/AuthContext";
import firebaseReAuth from "../../utils/firebaseReAuth";


let timeout = null;
const MultipleSearch = ({ onClose }) => {
  const initialInputSet = { search_query: "", location: "", country: "", foreign_flag: 1 };
  const [inputSets, setInputSets] = useState([initialInputSet]);
  const { authUser, setAuthUser } = useContext(AuthContext);
  console.log(authUser);
  const [formData, setFormData] = useState({
    init: false,
    page_count: 5,
    search_query: "gear manufacturer",
    search_city: "delhi, india",
    selected_suggestion: false,
    error: null,
  });
  const [data, setData] = useState([]);
  const [loadMore, setLoadMore] = useState(true);
  const [suggestionList, setSuggestionList] = useState([]);
  const [suggList, setSuggList] = useState(false);
  const [city, setCity] = useState("delhi");
  const [lon, setLon] = useState("77.286226");
  const [lat, setLat] = useState("28.7486784");
  const [country, setCountry] = useState("india");
  const [loading, setLoading] = useState({
    firstLoad: true,
    status: false,
    location: false,
    fetched: false,
    limitReached: false,
  });
  const [gLoginModel, setGLoginModel] = useState(false);
  const [selectedInputIndex, setSelectedInputIndex] = useState(null);
  const handleAddInputSet = () => {
    if (inputSets.length < 10) {
      setInputSets([...inputSets, { ...initialInputSet}]);
    }
  };
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
  



  const handleClickToggleGoogleLogin = (e, status = false) => {
    setGLoginModel(status);

    if (authUser.auth !== false && authUser.token !== null) handleClickSubmit(e);
  };

  const handleSubmit = async () => {
    
    try {

      if (authUser.auth === false || authUser.token === null) {
        setGLoginModel(true);
        return;
      }
      console.log("Inside handleSubmit");

      const inputObjects = inputSets.map((inputSet) => ({
      search_query: inputSet.search_query,
      location: inputSet.search_city,
      country: inputSet.country,
      foreign_flag: inputSet.foreign_flag,
      page_count: inputSet.page_count
    }));

    console.log("Input Objects:", inputObjects);

    const queries = inputObjects.map((inputSet) => {
      const query1 = inputSet.search_query.toLowerCase();
      const query2 = inputSet.location.toLowerCase().split(/ [s,]+/).join("+");
      const query3 = inputSet.country.toLowerCase();
      const query4 = inputSet.foreign_flag;
      const query5 = inputSet.page_count || 5;
      
      return {
        query1,
        query2,
        query3,
        query4,
        query5
        
      };
      
    });
      
      console.log("Queries:", queries);

      console.log(country, city, lat, lon, "country"); 


      if (!Array.isArray(inputSets)) {
        // Handle it according to your logic (e.g., set an error state)
        console.error('inputSets is not an array');
        return;
      }
  
      if (!formData.selected_suggestion) return toast.error("Select location from list");
  
      setData([]);
      setFormData((formData) => ({ ...formData, init: true, error: null }));
      setLoadMore(true);
      console.log(authUser);
      const auth_id = authUser.token; // Assuming auth_id is the token
      console.log(auth_id)
  
      const searchParameters = queries.map(({query1, query2, query3, query4, query5}) => ({
        search_query: query1,
        geography: query2,
        foreign_flag: query4,
        page_count: query5,
        search_country: query3,
      }));
      
      const requestBody = {
        b2b_user_uid: "",
        user_email: authUser.email,
        auth_id: auth_id,
        search_parameters: searchParameters,
        latitude: "37.0902",
        longitude: "95.7129",
        scheduled_datetime: formattedDate,
      };
      console.log(requestBody);
  
      await fetchSearchData(requestBody);
      
    } catch (error) {
      console.error(error);
    }
     
    
  };
  

  const fetchSearchData = useCallback(async (body, retry = 0) => {
    try {
      setLoading((d) => ({ ...d, status: true }));
  
      const apiUrl = 'http://35.154.129.126/GetB2bSearchScheduler/b2b-search-scheduler';

      const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    console.log(response);

  if (!response.ok) {
  throw new Error(`HTTP error! Status: ${response.status}`);
  
  }
  onClose();

  const res = await response.json();
    if(res.status == "success"){
      throw new Error(res.data);

    }

      else if (res.status !== "success") {
  
      // if (!Array.isArray(res.data)) {
      //   if (res.data.alert) throw new Error(res.data?.alert);
      //   throw new Error(res.data);
      // }
  
      // if (res.data[0]?.auth_refresh_flag?.toString() === "1") {
        const toastId = toast.loading("Session expired. Re-Authenticating");
  
        await firebaseReAuth(retry, toastId, (status) => {;
  
        if (toastId) toast.remove(toastId);
        if(status == false) return;
  
        const token = localStorage.getItem("access_token");
        let gInfo = {};
        try {
          const g_info = localStorage.getItem("g_info");
          gInfo = JSON.parse(g_info);
        } catch (err) {
          gInfo = {};
          console.log(err);
        }
  
        setAuthUser((authUser) => ({ ...authUser, token, ...gInfo }));
  
        retry++;
        body.auth_id = token;
         fetchSearchData(body, (prevData =[]), retry);
        });
        
       }
  
      if (res.data[0]?.credit_exhaust_flag?.toString() === "1") {
        setLoading((d) => ({ ...d, limitReached: true }));
        setFormData((formData) => ({ ...formData, error: res.data[0]?.alert }));
      }
  
      // if (res.data[0]?.alert) throw new Error(res.data[0]?.alert);
  
      // const details = res.data?.map((ele) => {
      //   try {
      //     ele.social_media_links = JSON.parse(ele.social_media_links);
      //   } catch (err) {
      //     ele.social_media_links = null;
      //   }
  
      //   for (let i = 0; i < viewMoreFields.length; i++) {
      //     const field = viewMoreFields[i];
      //     let isNull = false;
  
      //     if ((ele[field] || "").startsWith('"')) {
      //       try {
      //         ele[field] = JSON.parse(ele[field]);
      //         if (ele[field] === "null") isNull = true;
      //       } catch (err) {
      //         isNull = true;
      //         console.log(err);
      //       }
      //     }
  
      //     if (!isNull && ele[field] !== null) {
      //       console.log(ele.cname, isNull);
      //       ele.loadMore = true;
      //       break;
      //     }
      //   }
  
      //   return ele;
      // });
  
      // if (details?.length < 20) setLoadMore(false);
  
      setData((prevData) => [...prevData, ...details]);
      setLoading((d) => ({ ...d, status: false, fetched: true }));
      setFormData((formData) => ({ ...formData, error: null }));
  
    } catch (err) {
      setLoading((d) => ({ ...d, status: false }));
      setFormData((formData) => ({ ...formData, error: err.message }));
      alert(err.message);
      console.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    
  }, []);


  const handleSearchLocationAutocomplete = async (search_city) => {
    try {
      if (!search_city.trim()) return;

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${search_city}&apiKey=96745f19a268467682c774a4384a3289`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
        
      }

      const result = await response.json();
      console.log(result);
      if (Array.isArray(result.features)) {
        setCountry(result.features[0].properties?.country?.toLowerCase());
        setCity(
          result.features[0].properties?.city?.toLowerCase() ||
            result.features[0].properties?.address_line1?.toLowerCase()
        );
        console.log(country);
        setLon(result.features[0].properties?.lon?.toString());
        setLat(result.features[0].properties?.lat?.toString());

        const suggestions = result.features.map((feature) => {
          console.log(feature.properties?.city, feature.properties?.address_line1, feature.properties?.country);
          let data = "";
          if (feature.properties?.city) data = data + feature.properties?.city;
          else data = data + feature.properties?.address_line1;

          // if (feature.properties?.district) data = data + ", " + feature.properties?.district;
          if (feature.properties?.country) data = data + ", " + feature.properties?.country;

          return data;
        });

        setLoading((d) => ({ ...d, location: false }));

        setSuggestionList([...new Set(suggestions)]);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  const handleChange = (e, index, field) => {
    const { value } = e.target;

    if (field === "search_city") {

    //Update the specific input set's search_city value
      setInputSets((prevInputSets) => 
      prevInputSets.map((inputSet, i) =>
        i=== index ? { ...inputSet, [field]: value} : inputSet
        )
    );
      if (!value.trim()) setSuggestionList((prevLists) => prevLists.map((list, i) => ( i===index ?[]: list)));
      if (timeout) clearTimeout(timeout);
      if (formData.selected_suggestion) setFormData((d) => ({ ...d, selected_suggestion: false }));

      if (!loading.location && value.trim()) setLoading((d) => ({ ...d, location: true }));

      timeout = setTimeout(() => {
        handleSearchLocationAutocomplete(value);
        timeout = null;
      }, 1000);
      } 
       else if(field === "search_query"){
      setInputSets((prevInputSets) =>
            prevInputSets.map((inputSet, i) =>
            i === index ? { ...inputSet, search_query: value} : inputSet
            )
      );
       }else if(field === "page_count"){
        setInputSets((prevInputSets) =>
        prevInputSets.map((inputSet, i) =>
        i === index ? { ...inputSet, page_count: value} : inputSet
        )
      ); 
      }
      
      else{
      

      setInputSets((prevInputSets) =>
         prevInputSets.map((inputSet, i) =>
         i === index ? { ...inputSet, country: country, foreign_flag: country.toLowerCase() === 'india' ? 0 : 1, scheduled_datetime: formattedDate} : inputSet        
         )
       );
       console.log('country index 0', country);
       }

  };

   
  const handleSelectSuggestion = (index, suggestion) => {
    console.log('Before Update - inputSets:', inputSets);
    console.log(suggestion);
    setInputSets((prevInputSets) =>
    prevInputSets.map((inputSet, i) =>
      i === index ? { ...inputSet, search_city: suggestion, country:country, foreign_flag: country === 'india' ? 0 : 1} : inputSet
    )
  );
  console.log('After Update - inputSets:', inputSets);
    setFormData({ ...formData, search_city: suggestion, selected_suggestion: true, page_count:page_count });
    setSuggestionList([]); // Clear suggestion list after selection
    setSuggList(false);
  };

  const handleSugggestionList = (index) => {
    if (formData.search_city?.trim().length > 1) {
      
      setSuggList(true);
      setSelectedInputIndex(index);
    } else {
      setSuggList(false);
      setSelectedInputIndex(null);
    }
  };

  const handleRemoveInputSet = (index) => {
    setInputSets((prevInputSets) =>
      prevInputSets.filter((inputSet, i) => i !== index)
    );
    // Clear suggestion list and selection when removing input set
    setSuggestionList([]);
    setSuggList(false);
    setSelectedInputIndex(null);
  };

  return (
    <>
    <div className="google-login">
      {gLoginModel && 
         
        <GoogleLogin onClose={(e) => handleClickToggleGoogleLogin(e, false)} />
     
      }
      </div>
    <div className="popup-container">
      {/* <button className="close-btn" onClick={onClose}>
        &times;
      </button> */}
      
      
      <div className="form-container">

        {inputSets.map((inputSet, index) => (
          <div key={index} className="form-group">
            <div className="input-set-container">
              <label htmlFor={`businessKeyword${index}`} className = "label" style={{ width: "100%", marginRight: "10px" }}>
                Business Search Keyword:
              </label>
            <Input
              id="query"
              className="input-field"
              placeholder="Enter your query"
              name="search_query"
              value={inputSet.search_query}
              onChange={(e) => handleChange(e, index, "search_query")}
            />
            </div>
            {/* <div className="relative " >  */}
            <div className="input-set-container relative">
              <label htmlFor={`location${index}`} className ="label" style={{ width: "50%" }}>
                Search Location:
              </label>
            <Input
              id="location"
              className="input-field"
              placeholder="Enter your location"
              name="search_city"
              value={inputSet.search_city }
              onChange={(e) => {
                handleChange(e, index, "search_city");
                handleSugggestionList(index);
              }}
            />

            {selectedInputIndex === index && suggList && inputSet.search_city !== "" && suggestionList?.length > 0 && (
              <ul className="suggestion-list2 absolute flex flex-col justify-center shadow  top-full mt-2 left-1/2 transform -translate-x-1/2 rounded-lg bg-white max-w-sm z-10 overflow-hidden" style={{ width: "700px" }}>
                {suggestionList.map((suggestion, i) => (
                  <li 
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200 border-b"
                  key={i}
                  onClick={() => handleSelectSuggestion(index, suggestion)}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
             {/* </div>  */}
            </div>
            <div className="input-set-container">
              <label htmlFor={`page_count${index}`} className="label" style={{ width: "50%" }}>
                Page Number:
              </label>
            <Input
              id="page_count"
              className="input-field1"
              placeholder="Enter the page Number"
              name="page_count"
              value={inputSet.page_count}
              onChange={(e) => handleChange(e, index, "page_count")}
            />
            </div>

            <button 
                className="remove-btn"
                onClick = {() => handleRemoveInputSet(index)}
              >
                -
              </button>
            </div>
            
        ))}
      </div>
      {inputSets.length < 10 && (
        <Button 
        className="add-btn"
        variant="contained" 
        onClick={handleAddInputSet}  
        disabled={inputSets.length >= 10}
        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
        >
          Add More Queries
        </Button>
      )}

      <div className="btn-container">
        <Button className="btn" variant="contained" onClick={handleSubmit} >
          Schedule Time
        </Button>
        <Button className="btn" variant="contained" onClick={handleSubmit} >
          Schedule Extraction
        </Button>
        <Button className="btn" variant="contained" onClick={onClose} >
          Close
        </Button>
      </div>
     

    </div>
    </>

  );
};

export default MultipleSearch;



