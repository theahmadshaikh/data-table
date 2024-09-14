import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import axios from 'axios';
import 'primeicons/primeicons.css'; 

interface DataRecord {
    id: number;
    title: string;
    place_of_origin: string;
    artist_display: string;
    inscriptions: string;
    date_start: string;
    date_end: string;
}

const PaginatedTable: React.FC = () => {
    const [data, setData] = useState<DataRecord[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<DataRecord[]>([]);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [showOverlay, setShowOverlay] = useState<boolean>(false);
    const [numberOfRows, setNumberOfRows] = useState<number>(0);

    // Fetch data from API
    const fetchData = async (pageNumber: number) => {
        setLoading(true);
        try {
            console.log(`Fetching data for page ${pageNumber}`);
            const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${pageNumber}&limit=12`);
            console.log('Fetched Data:', response.data);
            setData(response.data.data);
            setTotalRecords(response.data.pagination.total_pages * 12); // Total records based on the API response
        } catch (error) {
            console.error('Error fetching data', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData(page);
    }, [page]);

    // Handle row selection changes
    const handleRowSelect = (e: { value: DataRecord[] }) => {
        console.log('Selection change event:', e);
        setSelectedRecords(e.value);
    };

    // Handle pagination changes
    const onPageChange = (event: { first: number }) => {
        console.log('Page change event:', event);
        const newPage = Math.floor(event.first / 12) + 1; // Calculate page number based on first index
        setPage(newPage);
    };

    // Checkbox template for row selection
    const checkboxTemplate = (rowData: DataRecord) => {
        const isChecked = selectedRecords.some(record => record.id === rowData.id);
        return (
            <Checkbox
                checked={isChecked}
                onChange={() => {
                    setSelectedRecords(prevSelected => {
                        const updatedSelection = new Set(prevSelected.map(record => record.id));
                        if (updatedSelection.has(rowData.id)) {
                            updatedSelection.delete(rowData.id);
                        } else {
                            updatedSelection.add(rowData.id);
                        }
                        return data.filter(record => updatedSelection.has(record.id));
                    });
                }}
            />
        );
    };

    // Function to handle overlay submission
    const handleSubmit = async () => {
        setLoading(true);
        const neededRows = numberOfRows;
        const rowsPerPage = 12;
        const pagesToFetch = Math.ceil(neededRows / rowsPerPage);

        const allRecords: DataRecord[] = [];
        try {
            for (let i = 1; i <= pagesToFetch; i++) {
                console.log(`Fetching data for page ${i}`);
                const response = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${i}&limit=12`);
                allRecords.push(...response.data.data);
                if (allRecords.length >= neededRows) break; // Stop if we've fetched enough rows
            }
            const selectedCount = Math.min(neededRows, allRecords.length);
            setSelectedRecords(allRecords.slice(0, selectedCount));
        } catch (error) {
            console.error('Error fetching records', error);
        } finally {
            setLoading(false);
            setShowOverlay(false); // Hide overlay after submission
        }
    };

    const titleHeader = (
        <div className="p-d-flex p-ai-center">
            <i
                className="pi pi-chevron-down"
                style={{ fontSize: '1.5rem', cursor: 'pointer', color: '#000' }}
                onClick={() => setShowOverlay(true)}
            >
            </i>
            <span style={{marginLeft:"30px",fontSize:"18px",color:"#374151"}}>Title</span>

        </div>
    );

    return (
        <div>
            <DataTable
                value={data}
                paginator
                rows={12}
                first={(page - 1) * 12} // Set the first index based on the current page
                totalRecords={totalRecords}
                lazy
                onPage={onPageChange}
                loading={loading}
                selectionMode="multiple"
                selection={selectedRecords}
                onSelectionChange={handleRowSelect}
                dataKey="id"
            >
                <Column selectionMode="multiple" body={checkboxTemplate}></Column>
                <Column field="title" header={titleHeader}></Column>
                <Column field="place_of_origin" header="Place of Origin"></Column>
                <Column field="artist_display" header="Artist"></Column>
                <Column field="inscriptions" header="Inscriptions"></Column>
                <Column field="date_start" header="Start Date"></Column>
                <Column field="date_end" header="End Date"></Column>
            </DataTable>

            <Dialog
                visible={showOverlay}
                style={{ width: '300px', backgroundColor: '#f9f9f9' }} 
                footer={
                    <div className="p-d-flex p-jc-center p-mt-2">
                        <Button label="Submit" icon="pi pi-check" onClick={handleSubmit} className="p-mt-2" />
                    </div>
                }
                onHide={() => setShowOverlay(false)}
                headerStyle={{ display: 'none' }} // Hide the header of the dialog
            >
                <div className="p-d-flex p-flex-column p-ai-center" style={{ padding: '1rem' }}>
                    <InputText
                        type="number"
                        value={numberOfRows.toString()} // Convert to string for InputText value
                        onChange={(e) => setNumberOfRows(parseInt(e.target.value, 10))}
                        placeholder="Enter number of rows"
                        style={{ marginBottom: '1rem', width: '100%' }} 
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default PaginatedTable;
