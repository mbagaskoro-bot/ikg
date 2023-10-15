import "./App.css"
import Graph from "react-graph-vis"
import React, { useState } from "react"
import { Analytics } from "@vercel/analytics/react"

const DEFAULT_PARAMS = {
    model: "text-davinci-003",
    temperature: 0.3,
    max_tokens: 800,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
}

const SELECTED_PROMPT = "STATELESS"

const options = {
    layout: {
        hierarchical: false,
    },
    edges: {
        color: "#34495e",
    },
}

function App() {
    const [graphState, setGraphState] = useState({
        nodes: [],
        edges: [],
    })

    const clearState = () => {
        setGraphState({
            nodes: [],
            edges: [],
        })
    }

    const updateGraph = (updates) => {
        // updates will be provided as a list of lists
        // each list will be of the form [ENTITY1, RELATION, ENTITY2] or [ENTITY1, COLOR]

        var current_graph = JSON.parse(JSON.stringify(graphState))

        if (updates.length === 0) {
            return
        }

        // check type of first element in updates
        if (typeof updates[0] === "string") {
            // updates is a list of strings
            updates = [updates]
        }

        updates.forEach((update) => {
            if (update.length === 3) {
                // update the current graph with a new relation
                const [entity1, relation, entity2] = update

                // check if the nodes already exist
                var node1 = current_graph.nodes.find(
                    (node) => node.id === entity1
                )
                var node2 = current_graph.nodes.find(
                    (node) => node.id === entity2
                )

                if (node1 === undefined) {
                    current_graph.nodes.push({
                        id: entity1,
                        label: entity1,
                        color: "#ffffff",
                    })
                }

                if (node2 === undefined) {
                    current_graph.nodes.push({
                        id: entity2,
                        label: entity2,
                        color: "#ffffff",
                    })
                }

                // check if an edge between the two nodes already exists and if so, update the label
                var edge = current_graph.edges.find(
                    (edge) => edge.from === entity1 && edge.to === entity2
                )
                if (edge !== undefined) {
                    edge.label = relation
                    return
                }

                current_graph.edges.push({
                    from: entity1,
                    to: entity2,
                    label: relation,
                })
            } else if (update.length === 2 && update[1].startsWith("#")) {
                // update the current graph with a new color
                const [entity, color] = update

                // check if the node already exists
                var node = current_graph.nodes.find(
                    (node) => node.id === entity
                )

                if (node === undefined) {
                    current_graph.nodes.push({
                        id: entity,
                        label: entity,
                        color: color,
                    })
                    return
                }

                // update the color of the node
                node.color = color
            } else if (update.length === 2 && update[0] == "DELETE") {
                // delete the node at the given index
                const [_, index] = update

                // check if the node already exists
                var node = current_graph.nodes.find((node) => node.id === index)

                if (node === undefined) {
                    return
                }

                // delete the node
                current_graph.nodes = current_graph.nodes.filter(
                    (node) => node.id !== index
                )

                // delete all edges that contain the node
                current_graph.edges = current_graph.edges.filter(
                    (edge) => edge.from !== index && edge.to !== index
                )
            }
        })
        setGraphState(current_graph)
    }

    const queryStatelessPrompt = (prompt, apiKey) => {
        fetch("prompts/stateless.prompt")
            .then((response) => response.text())
            .then((text) => text.replace("$prompt", prompt))
            .then((prompt) => {
                console.log(prompt)

                const params = { ...DEFAULT_PARAMS, prompt: prompt, stop: "\n" }

                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + String(apiKey),
                    },
                    body: JSON.stringify(params),
                }
                fetch("https://api.openai.com/v1/completions", requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            switch (response.status) {
                                case 401: // 401: Unauthorized: API key is wrong
                                    throw new Error(
                                        "Please double-check your API key."
                                    )
                                case 429: // 429: Too Many Requests: Need to pay
                                    throw new Error(
                                        "You exceeded your current quota, please check your plan and billing details."
                                    )
                                default:
                                    throw new Error(
                                        "Something went wrong with the request, please check the Network log"
                                    )
                            }
                        }
                        return response.json()
                    })
                    .then((response) => {
                        const { choices } = response
                        const text = choices[0].text
                        console.log(text)

                        const updates = JSON.parse(text)
                        console.log(updates)

                        updateGraph(updates)

                        document.getElementsByClassName("searchBar")[0].value =
                            ""
                        document.body.style.cursor = "default"
                        document.getElementsByClassName(
                            "generateButton"
                        )[0].disabled = false
                    })
                    .catch((error) => {
                        console.log(error)
                        alert(error)
                    })
            })
    }

    const queryStatefulPrompt = (prompt, apiKey) => {
        fetch("prompts/stateful.prompt")
            .then((response) => response.text())
            .then((text) => text.replace("$prompt", prompt))
            .then((text) => text.replace("$state", JSON.stringify(graphState)))
            .then((prompt) => {
                console.log(prompt)

                const params = { ...DEFAULT_PARAMS, prompt: prompt }

                const requestOptions = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + String(apiKey),
                    },
                    body: JSON.stringify(params),
                }
                fetch("https://api.openai.com/v1/completions", requestOptions)
                    .then((response) => {
                        if (!response.ok) {
                            switch (response.status) {
                                case 401: // 401: Unauthorized: API key is wrong
                                    throw new Error(
                                        "Please double-check your API key."
                                    )
                                case 429: // 429: Too Many Requests: Need to pay
                                    throw new Error(
                                        "You exceeded your current quota, please check your plan and billing details."
                                    )
                                default:
                                    throw new Error(
                                        "Something went wrong with the request, please check the Network log"
                                    )
                            }
                        }
                        return response.json()
                    })
                    .then((response) => {
                        const { choices } = response
                        const text = choices[0].text
                        console.log(text)

                        const new_graph = JSON.parse(text)

                        setGraphState(new_graph)

                        document.getElementsByClassName("searchBar")[0].value =
                            ""
                        document.body.style.cursor = "default"
                        document.getElementsByClassName(
                            "generateButton"
                        )[0].disabled = false
                    })
                    .catch((error) => {
                        console.log(error)
                        alert(error)
                    })
            })
    }

    const queryPrompt = (prompt, apiKey) => {
        if (SELECTED_PROMPT === "STATELESS") {
            queryStatelessPrompt(prompt, apiKey)
        } else if (SELECTED_PROMPT === "STATEFUL") {
            queryStatefulPrompt(prompt, apiKey)
        } else {
            alert("Please select a prompt")
            document.body.style.cursor = "default"
            document.getElementsByClassName(
                "generateButton"
            )[0].disabled = false
        }
    }

    const createGraph = () => {
        document.body.style.cursor = "wait"

        document.getElementsByClassName("generateButton")[0].disabled = true
        const prompt = document.getElementsByClassName("searchBar")[0].value
        const apiKey = "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"

        queryPrompt(prompt, apiKey)
    }

    return (
        <div className="h-screen w-screen flex flex-cols gap-2 bg-gradient-to-r from-indigo-200 via-red-200 to-yellow-100 background-animate">
            {/* SideBox */}
            <div className="border-2 border-black rounded-2xl ml-2 my-2 shadow-lg bg-white w-[400px] ">
                {/* GraphGenerate */}
                <div className="">
                    <h1 className=""></h1>
                    <p className=""></p>

                    <div className="overflow-hidden">
                        <div className="inputContainer">
                            <div
                                h
                                className="xl:py-5 sm:py-3 xl:px-10 font-bold text-black text-center sm:text-md xl:text-xl bg-lime-300 text-black rounded-xl block mt-2 border-2 border-dashed border-slate-800"
                                onClick={clearState}
                            >
                                <p>INTERACTIVE KNOWLEDGE GRAPH</p>
                            </div>
                            <textarea
                                className="searchBar block p-2.5 w-full h-[300px] text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 mt-2"
                                placeholder="Describe your graph..."
                            ></textarea>

                            <button
                                className="generateButton w-full xl:py-5 sm:py-3 xl:px-10 font-bold text-white hover:text-black text-center bg-slate-400 rounded-xl block mt-2 border-2 border-dashed border-slate-800 sm:text-md xl:text-xl"
                                onClick={createGraph}
                            >
                                GENERATE GRAPH
                            </button>
                            <button
                                className="clearButton w-full xl:py-5 sm:py-3 xl:px-10 font-bold text-white hover:text-black text-center sm:text-md xl:text-xl bg-pink-300 rounded-xl block mt-2 border-2 border-dashed border-slate-800"
                                onClick={clearState}
                            >
                                MAKE GRAPH CLEAR
                            </button>
                        </div>
                    </div>
                </div>
                {/* ChatAI */}
                <div></div>
            </div>

            {/* GraphDisplay */}
            <div className="border-2 border-black rounded-2xl mr-2 my-2 shadow-lg  overflow-hidden bg-white-800 bg-clip-padding backdrop-filter backdrop-blur-3xl bg-opacity-100 ">
                <Graph
                    graph={graphState}
                    options={options}
                    style={{
                        height: "1000px",
                        width: "1000px",
                    }}
                />
            </div>
        </div>
    )
}

export default App
