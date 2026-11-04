// Source of the Pastry workflows Arazzo document (arazzo 1.1.0), from the Workflow prototype.
// The three other workflows are summarised by a comment, as in the prototype.
export const PASTRY_ARAZZO_YAML = `arazzo: 1.1.0
info:
  title: Pastry workflows
  version: 1.2.0
sourceDescriptions:
  - name: apiPastry
    url: ./apipastry-2.0-openapi.yaml
    type: openapi
  - name: apiPastryV1
    url: ./apipastry-1.0-openapi.yaml
    type: openapi
  - name: pastryOrders
    url: ./pastry-orders-0.1.0-asyncapi.yaml
    type: asyncapi
workflows:
  - workflowId: restock-pastry
    summary: Restock a pastry
    description: >-
      Lists the pastries of a size and reads the first one. When it is
      already available the workflow ends; otherwise it is made available
      again at a new price, then read again to verify.
    inputs:
      type: object
      properties:
        size:
          type: string
          enum: [S, M, L]
          default: M
        newPrice:
          type: number
          default: 3.9
    steps:
      - stepId: listPastries
        description: List the pastries of the requested size.
        operationId: $sourceDescriptions.apiPastry.GetPastries
        parameters:
          - name: size
            in: query
            value: $inputs.size
        successCriteria:
          - condition: $statusCode == 200
        outputs:
          firstName: $response.body#/0/name
      - stepId: getPastry
        description: Read the first pastry to get its current price and status.
        operationId: $sourceDescriptions.apiPastry.GetPastryByName
        parameters:
          - name: name
            in: path
            value: $steps.listPastries.outputs.firstName
        successCriteria:
          - condition: $statusCode == 200
        onSuccess:
          - name: alreadyAvailable
            type: end
            criteria:
              - condition: $response.body#/status == 'available'
        outputs:
          oldPrice: $response.body#/price
          status: $response.body#/status
      - stepId: patchPastry
        description: Make the pastry available again at the new price.
        operationId: $sourceDescriptions.apiPastry.PatchPastry
        parameters:
          - name: name
            in: path
            value: $steps.listPastries.outputs.firstName
        requestBody:
          contentType: application/json
          payload:
            price: "{$inputs.newPrice}"
            status: available
          replacements:
            - target: /price
              value: $inputs.newPrice
        successCriteria:
          - condition: $statusCode == 200
        onFailure:
          - name: retryPatch
            type: retry
            retryAfter: 1
            retryLimit: 2
        outputs:
          newPrice: $response.body#/price
      - stepId: verifyPastry
        description: Read the pastry again and check it is now available.
        operationId: $sourceDescriptions.apiPastry.GetPastryByName
        parameters:
          - name: name
            in: path
            value: $steps.listPastries.outputs.firstName
        successCriteria:
          - condition: $statusCode == 200
          - condition: $response.body#/status == 'available'
          - context: $response.body#/status
            condition: ^available$
            type: regex
    outputs:
      pastryName: $steps.listPastries.outputs.firstName
      oldPrice: $steps.getPastry.outputs.oldPrice
      newPrice: $steps.patchPastry.outputs.newPrice
  # order-pastry, compare-prices, check-menu: 3 more workflows (lines 103-222)
`;

export const PASTRY_OVERLAY_YAML = `apiVersion: mocks.microcks.io/v1alpha1
kind: ArazzoSources
metadata:
  name: Pastry workflows
  version: 1.2.0
sources:
  apiPastry:
    name: API Pastry
    version: "2.0"
  apiPastryV1:
    name: API Pastry
    version: "1.0"
  pastryOrders:
    name: Pastry orders API
    version: 0.1.0
examples:
  restock-pastry:
    restock-eclair:
      inputs:
        size: M
        newPrice: 3.9
      steps:
        listPastries:
          status: 200
          outputs:
            firstName: Eclair Cafe
        getPastry:
          status: 200
        patchPastry:
          status: 200
        verifyPastry:
          status: 200
      outputs:
        newPrice: 3.9
    already-available:
      inputs:
        size: L
      steps:
        listPastries:
          status: 200
          outputs:
            firstName: Millefeuille
        getPastry:
          status: 200
          outputs:
            status: available
      stopsAt: getPastry
`;
