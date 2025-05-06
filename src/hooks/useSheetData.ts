
import { useState, useEffect } from "react";
import { fetchPublicSheetData, parseSheetId } from "@/utils/googleApi";
import { transformSheetData } from "@/utils/sheetTransform";
import { useToast } from "@/components/ui/use-toast";

export const useSheetData = (sheetUrl: string, initialTabName: string = "") => {
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [sheetTabs, setSheetTabs] = useState<string[]>([]);
  const [selectedSheetTab, setSelectedSheetTab] = useState(initialTabName);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Array<{column: string, operator: string, value: string}>>([]);
  const { toast } = useToast();
  
  // Load sheet tabs on initial render
  useEffect(() => {
    loadSheetTabs();
  }, []);

  // Load sheet data when tab is selected
  useEffect(() => {
    if (selectedSheetTab) {
      loadSheetData(selectedSheetTab);
    }
  }, [selectedSheetTab]);
  
  const loadSheetTabs = async () => {
    try {
      setIsLoading(true);
      
      // Extract sheet ID from URL
      const sheetId = parseSheetId(sheetUrl);
      
      if (!sheetId) {
        toast({
          title: "Error",
          description: "Invalid Google Sheet URL",
          variant: "destructive",
        });
        return;
      }
      
      // Complete list of all tabs in the sheet
      const allSheetTabs = [
        "GLOBAL", 
        "DE", 
        "ES", 
        "IT", 
        "FR", 
        "GB", 
        "US", 
        "NL", 
        "DK",
        "Fl",
        "NO",
        "SE",
        "CL", 
        "BR", 
        "AR",
        "MX",
        "CO",
        "PE",
        "LATAM",
        "NORDIC",
        "APAC"
      ];
      setSheetTabs(allSheetTabs);
      
      // Set the first tab as selected by default
      if (allSheetTabs.length > 0 && !selectedSheetTab) {
        setSelectedSheetTab(allSheetTabs[0]);
      }
    } catch (error) {
      console.error("Error loading sheet tabs:", error);
      toast({
        title: "Error",
        description: "Failed to load sheet tabs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSheetData = async (tabName: string) => {
    try {
      setIsLoading(true);
      
      // Extract sheet ID from URL
      const sheetId = parseSheetId(sheetUrl);
      
      if (!sheetId) {
        toast({
          title: "Error",
          description: "Invalid Google Sheet URL",
          variant: "destructive",
        });
        return;
      }
      
      // Load the sheet data for the selected tab
      const data = await fetchPublicSheetData(sheetId, tabName);
      
      if (data && data.length > 0) {
        // Transform raw data to objects with headers as keys
        const transformedData = transformSheetData(data);
        setSheetData(transformedData);
      }
    } catch (error) {
      console.error("Error loading sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load sheet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to data
  const applyFilters = (data: any[]) => {
    if (!activeFilters.length) return data;
    
    return data.filter(item => {
      return activeFilters.every(filter => {
        const value = String(item[filter.column] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        switch(filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'not-equals':
            return value !== filterValue;
          case 'contains':
            return value.includes(filterValue);
          case 'greater-than':
            return Number(value) > Number(filterValue);
          case 'less-than':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });
  };

  // Filter data based on search term and active filters
  const filteredData = applyFilters(
    searchTerm 
      ? sheetData.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : sheetData
  );

  // Handle applying new filters
  const handleApplyFilters = (filters: Array<{column: string, operator: string, value: string}>) => {
    setActiveFilters(filters);
  };

  return {
    sheetData,
    sheetTabs,
    selectedSheetTab,
    isLoading,
    searchTerm,
    filteredData,
    activeFilters,
    setSelectedSheetTab,
    setSearchTerm,
    loadSheetData,
    handleApplyFilters,
  };
};
