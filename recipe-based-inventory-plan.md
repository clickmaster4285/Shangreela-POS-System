# Recipe-Based Inventory Plan

## Purpose

Create a system where each menu item has a standard average recipe. When an item is sold, the system should automatically calculate ingredient usage, reduce stock, and calculate production cost.

## How It Works

1. Define a standard recipe for each menu item.
2. Link each recipe ingredient to an inventory item.
3. Track total quantity sold for each menu item in real time.
4. Calculate ingredient consumption using:

`Ingredient Consumption = Quantity Per Serving x Quantity Sold`

5. Automatically:

- deduct raw materials from stock
- record ingredient usage
- calculate production cost

## Main Rules

- stock should be deducted only when an order is completed
- cancelled or refunded orders should reverse stock deduction
- the same sale should not deduct stock twice
- recipe changes should apply only to future sales

## What We Need

- menu items
- inventory ingredients
- recipe definitions
- sales records
- consumption logs
- cost records

## Benefits

- automatic stock consumption tracking
- accurate raw material usage
- better production cost control
- less manual inventory work
- more reliable reporting

## Implementation Steps

### 1. Recipe Setup

- create standard recipes for menu items
- map ingredients to inventory stock

### 2. Sales Integration

- track sold quantity of each menu item in real time
- connect completed sales to recipe logic

### 3. Inventory Automation

- calculate ingredient usage from sales
- auto-deduct stock
- store usage history

### 4. Costing and Reporting

- calculate cost per menu item
- create stock and consumption reports

## Success Criteria

- each completed sale updates ingredient stock automatically
- ingredient usage matches recipe standards
- production cost can be calculated correctly
- reports are accurate and consistent

## Summary

We will use standard recipes to convert menu sales into automatic ingredient consumption, stock deduction, and production cost tracking. This will make inventory control more accurate, consistent, and automated.
