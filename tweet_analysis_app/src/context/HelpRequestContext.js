import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

// Create the context
const HelpRequestContext = createContext();

// State abbreviations and full names mapping
const stateMap = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia', 'PR': 'Puerto Rico'
};

// Common country codes and names
const countryMap = {
  'US': ['United States', 'USA', 'America', 'United States of America'],
  'UK': ['United Kingdom', 'Great Britain', 'England', 'Britain'],
  'CA': ['Canada'],
  'AU': ['Australia'],
  'FR': ['France'],
  'DE': ['Germany', 'Deutschland'],
  'JP': ['Japan'],
  'CN': ['China', 'People\'s Republic of China'],
  'IN': ['India'],
  'BR': ['Brazil', 'Brasil'],
  'MX': ['Mexico', 'México'],
  'IT': ['Italy', 'Italia'],
  'ES': ['Spain', 'España'],
  'NL': ['Netherlands', 'Holland'],
  'RU': ['Russia', 'Russian Federation'],
  'AF': ['Afghanistan'],
  'AR': ['Argentina'],
  'AT': ['Austria', 'Österreich'],
  'BD': ['Bangladesh'],
  'BE': ['Belgium', 'België', 'Belgique'],
  'BG': ['Bulgaria'],
  'BO': ['Bolivia'],
  'CH': ['Switzerland', 'Schweiz', 'Suisse'],
  'CL': ['Chile'],
  'CO': ['Colombia'],
  'CR': ['Costa Rica'],
  'CU': ['Cuba'],
  'CZ': ['Czech Republic', 'Czechia', 'Czech'],
  'DK': ['Denmark', 'Danmark'],
  'DO': ['Dominican Republic'],
  'DZ': ['Algeria'],
  'EC': ['Ecuador'],
  'EG': ['Egypt'],
  'FI': ['Finland', 'Suomi'],
  'GR': ['Greece', 'Hellas', 'Ελλάδα'],
  'GT': ['Guatemala'],
  'HK': ['Hong Kong'],
  'HN': ['Honduras'],
  'HR': ['Croatia', 'Hrvatska'],
  'HU': ['Hungary', 'Magyarország'],
  'ID': ['Indonesia'],
  'IE': ['Ireland', 'Éire'],
  'IL': ['Israel'],
  'IQ': ['Iraq'],
  'IR': ['Iran'],
  'IS': ['Iceland', 'Ísland'],
  'JM': ['Jamaica'],
  'JO': ['Jordan'],
  'KE': ['Kenya'],
  'KR': ['South Korea', 'Korea'],
  'KP': ['North Korea'],
  'KW': ['Kuwait'],
  'LB': ['Lebanon'],
  'LK': ['Sri Lanka'],
  'MA': ['Morocco'],
  'MY': ['Malaysia'],
  'NG': ['Nigeria'],
  'NO': ['Norway', 'Norge'],
  'NP': ['Nepal'],
  'NZ': ['New Zealand'],
  'PA': ['Panama'],
  'PE': ['Peru', 'Perú'],
  'PH': ['Philippines'],
  'PK': ['Pakistan'],
  'PL': ['Poland', 'Polska'],
  'PT': ['Portugal'],
  'PY': ['Paraguay'],
  'RO': ['Romania'],
  'SA': ['Saudi Arabia'],
  'SE': ['Sweden', 'Sverige'],
  'SG': ['Singapore'],
  'SI': ['Slovenia'],
  'SK': ['Slovakia'],
  'SV': ['El Salvador'],
  'TH': ['Thailand'],
  'TR': ['Turkey', 'Türkiye'],
  'TW': ['Taiwan'],
  'UA': ['Ukraine', 'Україна'],
  'UG': ['Uganda'],
  'UY': ['Uruguay'],
  'VE': ['Venezuela'],
  'VN': ['Vietnam', 'Việt Nam'],
  'ZA': ['South Africa']
};

// Reverse lookup for state and country codes
const reverseStateMap = {};
Object.entries(stateMap).forEach(([abbr, name]) => {
  reverseStateMap[name.toLowerCase()] = abbr.toLowerCase();
});

const reverseCountryMap = {};
Object.entries(countryMap).forEach(([code, names]) => {
  names.forEach(name => {
    reverseCountryMap[name.toLowerCase()] = code.toLowerCase();
  });
});

// Create a provider component
export const HelpRequestProvider = ({ children }) => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch help requests from Supabase
  useEffect(() => {
    const fetchHelpRequests = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('help_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHelpRequests(data || []);
      } catch (error) {
        console.error('Error fetching help requests:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpRequests();

    const subscription = supabase
      .channel('help_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, (payload) => {
        fetchHelpRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Expand location keywords to include state/country abbreviations and full names
  const expandLocationKeywords = (location) => {
    const keywords = location.toLowerCase().split(/[,\s]+/).filter(word => word.length > 1);
    const expandedKeywords = new Set(keywords);
    
    // Check if the location contains USA references
    const usaReferences = ['usa', 'united states', 'america', 'us', 'u.s.', 'u.s.a.'];
    const containsUSA = keywords.some(word => usaReferences.includes(word));
    
    // Extract state information
    let stateIdentified = false;
    let stateKeywords = [];
    
    // Check for state abbreviations and full names
    keywords.forEach(keyword => {
      // If keyword is a state abbreviation, add the full state name and mark as identified
      if (stateMap[keyword.toUpperCase()]) {
        const stateName = stateMap[keyword.toUpperCase()].toLowerCase();
        expandedKeywords.add(stateName);
        if (containsUSA) {
          stateKeywords.push(keyword.toLowerCase(), stateName);
          stateIdentified = true;
        }
      }
      
      // If keyword is a state name, add the abbreviation and mark as identified
      if (reverseStateMap[keyword]) {
        const stateCode = reverseStateMap[keyword];
        expandedKeywords.add(stateCode);
        if (containsUSA) {
          stateKeywords.push(keyword, stateCode);
          stateIdentified = true;
        }
      }
      
      // If keyword is a country code, add all its variations
      if (countryMap[keyword.toUpperCase()]) {
        countryMap[keyword.toUpperCase()].forEach(name => {
          expandedKeywords.add(name.toLowerCase());
        });
      }
      
      // If keyword is a country name, add its code
      if (reverseCountryMap[keyword]) {
        expandedKeywords.add(reverseCountryMap[keyword]);
      }
    });
    
    return {
      all: Array.from(expandedKeywords),
      priorityState: stateIdentified && containsUSA ? stateKeywords : []
    };
  };

  // Calculate confidence score based on matches in gen_ai_output
  const calculateConfidenceScore = async (location, emergencyType, otherEmergencyDetails) => {
    try {
      // Define keywords to look for in the gen_ai_output table
      const locationKeywordData = expandLocationKeywords(location);
      const locationKeywords = locationKeywordData.all;
      const priorityStateKeywords = locationKeywordData.priorityState;
      
      // Define disaster type keywords
      let disasterKeywords = [];
      if (emergencyType === 'other' && otherEmergencyDetails) {
        // Extract keywords from the "other" field
        disasterKeywords = otherEmergencyDetails.toLowerCase().split(/[,\s]+/).filter(word => word.length > 2);
      } else {
        // Use the selected emergency type
        disasterKeywords = [emergencyType.toLowerCase()];
      }
      
      // Search for recent tweets that mention both the location and disaster type
      const { data, error } = await supabase
        .from('multiprocessing_gen_ai_output')
        .select('*')
        .eq('genuine_disaster', true)
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return 'Low'; // No tweets found at all
      }
      
      // Separate matches for each criteria
      let locationOnlyMatches = [];
      let disasterOnlyMatches = [];
      let fullMatches = []; // Tweets matching both criteria
      let stateMatches = []; // Tweets matching state (for US addresses)
      
      data.forEach(tweet => {
        const tweetText = tweet.tweet_text ? tweet.tweet_text.toLowerCase() : '';
        const tweetLocation = tweet.location ? tweet.location.toLowerCase() : '';
        
        // Check if any location keywords match
        const locationMatch = locationKeywords.some(keyword => 
          tweetLocation.includes(keyword) || tweetText.includes(keyword)
        );
        
        // Check for state match (US addresses)
        const stateMatch = priorityStateKeywords.length > 0 && priorityStateKeywords.some(keyword =>
          tweetLocation.includes(keyword) || tweetText.includes(keyword)
        );
        
        // Check if any disaster keywords match
        const disasterMatch = disasterKeywords.some(keyword => 
          tweetText.includes(keyword) || 
          (tweet.disaster_type && tweet.disaster_type.toLowerCase().includes(keyword))
        );
        
        if ((locationMatch || stateMatch) && disasterMatch) {
          fullMatches.push(tweet);
          if (stateMatch) {
            stateMatches.push(tweet);
          }
        } else if (locationMatch || stateMatch) {
          locationOnlyMatches.push(tweet);
          if (stateMatch && !locationOnlyMatches.includes(tweet)) {
            locationOnlyMatches.push(tweet);
          }
        } else if (disasterMatch) {
          disasterOnlyMatches.push(tweet);
        }
      });
      
      // Calculate confidence based on matches
      // If we have state matches (for USA addresses), prioritize those for high confidence
      if (stateMatches.length > 0) {
        return 'High'; // State match with disaster has highest priority
      } else if (fullMatches.length > 0) {
        // At least one tweet matches both location and disaster
        return 'High';
      } else if (locationOnlyMatches.length > 0 || disasterOnlyMatches.length > 0) {
        // Tweets match either location or disaster but not both
        return 'Medium';
      } else {
        // No matches at all
        return 'Low';
      }
      
    } catch (error) {
      console.error('Error calculating confidence score:', error);
      return 'Low'; // Default to low confidence if there's an error
    }
  };

  // Add a new help request
  const addHelpRequest = async (request) => {
    try {
      setLoading(true);
      
      // Calculate confidence score
      const confidenceScore = await calculateConfidenceScore(
        request.location, 
        request.emergencyType, 
        request.otherEmergencyDetails
      );
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('help_requests')
        .insert([
          {
            name: request.name,
            location: request.location,
            contact_info: request.contactInfo,
            emergency_type: request.emergencyType,
            other_emergency_details: request.otherEmergencyDetails || null,
            description: request.description,
            status: 'pending',
            confidence_score: confidenceScore
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update local state with the new request
      if (data && data.length > 0) {
        setHelpRequests(prevRequests => [data[0], ...prevRequests]);
      }
      
      return { success: true, confidenceScore };
    } catch (error) {
      console.error('Error adding help request:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update a help request status
  const updateHelpRequestStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('help_requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setHelpRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === id ? { ...request, status: newStatus } : request
        )
      );
    } catch (error) {
      console.error('Error updating help request status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter help requests
  const filterHelpRequests = (emergencyType, status) => {
    return helpRequests.filter(request => {
      const matchesEmergencyType = emergencyType === 'all' || request.emergency_type === emergencyType;
      const matchesStatus = status === 'all' || request.status === status;
      return matchesEmergencyType && matchesStatus;
    });
  };

  return (
    <HelpRequestContext.Provider 
      value={{ 
        helpRequests, 
        addHelpRequest, 
        updateHelpRequestStatus,
        filterHelpRequests,
        loading,
        error
      }}
    >
      {children}
    </HelpRequestContext.Provider>
  );
};

// Custom hook to use the help request context
export const useHelpRequests = () => {
  const context = useContext(HelpRequestContext);
  if (!context) {
    throw new Error('useHelpRequests must be used within a HelpRequestProvider');
  }
  return context;
}; 